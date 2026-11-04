data "aws_lambda_function" "thumbnail_generator_dev_lambda" {
  count         = local.need_dev_images ? 1 : 0
  function_name = "thumbnail-generator-dev-lambda"
}

resource "aws_sqs_queue" "thumbnail_generator_dev_deadletter_queue" {
  name = "thumbnail-generator-dev-deadletter-queue"
}

resource "aws_sqs_queue" "thumbnail_generator_dev_queue" {
  name = "thumbnail-generator-dev-queue"
  # Must be at least the lambda timeout; AWS recommends six times it
  visibility_timeout_seconds = 360

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.thumbnail_generator_dev_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "thumbnail_generator_dev_queue_policy" {
  queue_url = aws_sqs_queue.thumbnail_generator_dev_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.thumbnail_generator_dev_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = var.dev_event_topic_arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "thumbnail_generator_dev_subscription" {
  topic_arn = var.dev_event_topic_arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.thumbnail_generator_dev_queue.arn
  filter_policy = jsonencode({
    Entity = ["record"],
    Action = ["create", "copy"]
  })
}

data "aws_iam_policy_document" "assume_dev_thumbnail_generator_lambda_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "thumbnail_generator_dev_lambda_role" {
  name               = "thumbnail-generator-dev-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_dev_thumbnail_generator_lambda_role.json
}

resource "aws_iam_role_policy" "thumbnail_generator_dev_lambda_policy" {
  name = "thumbnail-generator-lambda-policy"
  role = aws_iam_role.thumbnail_generator_dev_lambda_role.name
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
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "s3:GetObject",
          "s3:PutObject",
        ]
        Effect   = "Allow"
        Resource = ["*", aws_sqs_queue.thumbnail_generator_dev_queue.arn]
      },
    ]
  })
}

resource "aws_lambda_function" "thumbnail_generator_dev_lambda" {
  package_type  = "Image"
  image_uri     = local.desired_images["thumbnail-generator-dev-lambda"]
  function_name = "thumbnail-generator-dev-lambda"
  role          = aws_iam_role.thumbnail_generator_dev_lambda_role.arn
  timeout       = 60
  memory_size   = 2048

  vpc_config {
    security_group_ids = [var.dev_security_group_id]
    subnet_ids         = var.private_subnet_ids
  }

  environment {
    variables = {
      ENV                    = var.dev_env
      SENTRY_DSN             = var.sentry_dsn
      DATABASE_URL           = var.dev_database_url
      S3_BUCKET              = var.dev_s3_bucket
      CLOUDFRONT_URL         = var.dev_cloudfront_url
      CLOUDFRONT_KEY_PAIR_ID = var.cloudfront_key_pair_id
      CLOUDFRONT_PRIVATE_KEY = var.cloudfront_private_key
      NODE_OPTIONS           = "--import ./packages/thumbnail_generator/dist/instrument.js"
    }
  }
}

resource "aws_lambda_event_source_mapping" "thumbnail_generator_dev_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.thumbnail_generator_dev_queue.arn
  function_name                      = aws_lambda_function.thumbnail_generator_dev_lambda.arn
  batch_size                         = 1
  maximum_batching_window_in_seconds = 0
}
