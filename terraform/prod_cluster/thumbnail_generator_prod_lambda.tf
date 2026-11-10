resource "aws_sqs_queue" "thumbnail_generator_prod_deadletter_queue" {
  name = "thumbnail-generator-prod-deadletter-queue"
}

resource "aws_sqs_queue" "thumbnail_generator_prod_queue" {
  name = "thumbnail-generator-prod-queue"
  # Must be at least the lambda timeout; AWS recommends six times it
  visibility_timeout_seconds = 360

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.thumbnail_generator_prod_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "thumbnail_generator_prod_queue_policy" {
  queue_url = aws_sqs_queue.thumbnail_generator_prod_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.thumbnail_generator_prod_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = var.event_topic_arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "thumbnail_generator_prod_subscription" {
  topic_arn = var.event_topic_arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.thumbnail_generator_prod_queue.arn
  filter_policy = jsonencode({
    Entity = ["record"],
    Action = ["create", "copy"]
  })
}

data "aws_iam_policy_document" "assume_prod_thumbnail_generator_lambda_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "thumbnail_generator_prod_lambda_role" {
  name               = "thumbnail-generator-prod-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_prod_thumbnail_generator_lambda_role.json
}

resource "aws_iam_role_policy" "thumbnail_generator_prod_lambda_policy" {
  name = "thumbnail-generator-lambda-policy"
  role = aws_iam_role.thumbnail_generator_prod_lambda_role.name
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
        Resource = aws_sqs_queue.thumbnail_generator_prod_queue.arn
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
        ]
        Effect   = "Allow"
        Resource = "${var.s3_bucket_arn}/*"
      },
    ]
  })
}

resource "aws_lambda_function" "thumbnail_generator_prod_lambda" {
  package_type  = "Image"
  image_uri     = var.thumbnail_generator_lambda_image
  function_name = "thumbnail-generator-prod-lambda"
  role          = aws_iam_role.thumbnail_generator_prod_lambda_role.arn
  timeout       = 60
  memory_size   = 2048

  vpc_config {
    security_group_ids = [var.prod_security_group_id]
    subnet_ids         = var.private_subnet_ids
  }

  environment {
    variables = {
      ENV                    = var.env
      SENTRY_DSN             = var.sentry_dsn
      DATABASE_URL           = var.prod_database_url
      S3_BUCKET              = var.s3_bucket
      CLOUDFRONT_URL         = var.cloudfront_url
      CLOUDFRONT_KEY_PAIR_ID = var.cloudfront_key_pair_id
      CLOUDFRONT_PRIVATE_KEY = var.cloudfront_private_key
      NODE_OPTIONS           = "--import ./packages/thumbnail_generator/dist/instrument.js"
    }
  }
}

resource "aws_lambda_event_source_mapping" "thumbnail_generator_prod_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.thumbnail_generator_prod_queue.arn
  function_name                      = aws_lambda_function.thumbnail_generator_prod_lambda.arn
  batch_size                         = 1
  maximum_batching_window_in_seconds = 0
}
