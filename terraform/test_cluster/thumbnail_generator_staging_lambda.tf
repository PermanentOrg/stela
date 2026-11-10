data "aws_lambda_function" "thumbnail_generator_staging_lambda" {
  count         = local.need_staging_images ? 1 : 0
  function_name = "thumbnail-generator-staging-lambda"
}

resource "aws_sqs_queue" "thumbnail_generator_staging_deadletter_queue" {
  name = "thumbnail-generator-staging-deadletter-queue"
}

resource "aws_sqs_queue" "thumbnail_generator_staging_queue" {
  name                       = "thumbnail-generator-staging-queue"
  visibility_timeout_seconds = 360

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.thumbnail_generator_staging_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "thumbnail_generator_staging_queue_policy" {
  queue_url = aws_sqs_queue.thumbnail_generator_staging_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.thumbnail_generator_staging_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = var.staging_event_topic_arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "thumbnail_generator_staging_subscription" {
  topic_arn = var.staging_event_topic_arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.thumbnail_generator_staging_queue.arn
  filter_policy = jsonencode({
    Entity = ["record"],
    Action = ["create", "copy"]
  })
}

data "aws_iam_policy_document" "assume_staging_thumbnail_generator_lambda_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "thumbnail_generator_staging_lambda_role" {
  name               = "thumbnail-generator-staging-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_staging_thumbnail_generator_lambda_role.json
}

resource "aws_iam_role_policy" "thumbnail_generator_staging_lambda_policy" {
  name = "thumbnail-generator-lambda-policy"
  role = aws_iam_role.thumbnail_generator_staging_lambda_role.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
        ]
        Effect   = "Allow"
        Resource = aws_sqs_queue.thumbnail_generator_staging_queue.arn
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
        ]
        Effect   = "Allow"
        Resource = "${var.staging_s3_bucket_arn}/*"
      },
    ]
  })
}

resource "aws_lambda_function" "thumbnail_generator_staging_lambda" {
  package_type  = "Image"
  image_uri     = local.desired_images["thumbnail-generator-staging-lambda"]
  function_name = "thumbnail-generator-staging-lambda"
  role          = aws_iam_role.thumbnail_generator_staging_lambda_role.arn
  timeout       = 60
  memory_size   = 2048

  vpc_config {
    security_group_ids = [var.staging_security_group_id]
    subnet_ids         = var.private_subnet_ids
  }

  environment {
    variables = {
      ENV                    = var.staging_env
      SENTRY_DSN             = var.sentry_dsn
      DATABASE_URL           = var.staging_database_url
      S3_BUCKET              = var.staging_s3_bucket
      CLOUDFRONT_URL         = var.staging_cloudfront_url
      CLOUDFRONT_KEY_PAIR_ID = var.cloudfront_key_pair_id
      CLOUDFRONT_PRIVATE_KEY = var.cloudfront_private_key
      NODE_OPTIONS           = "--import ./packages/thumbnail_generator/dist/instrument.js"
    }
  }
}

resource "aws_lambda_event_source_mapping" "thumbnail_generator_staging_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.thumbnail_generator_staging_queue.arn
  function_name                      = aws_lambda_function.thumbnail_generator_staging_lambda.arn
  batch_size                         = 1
  maximum_batching_window_in_seconds = 0
}
