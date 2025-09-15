data "aws_lambda_function" "record_thumbnail_staging_lambda" {
  function_name = "record-thumbnail-staging-lambda"
}

resource "aws_sns_topic" "record_thumbnail_staging_topic" {
  name = "record-thumbnail-staging-topic"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "s3.amazonaws.com"
        },
        Action   = "sns:Publish",
        Resource = "*",
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = var.aws_account_id
          }
          ArnLike = {
            "AWS:SourceArn" = "arn:aws:s3:*:*:permanent-staging"
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue" "record_thumbnail_staging_deadletter_queue" {
  name = "record-thumbnail-staging-deadletter-queue"
}

resource "aws_sqs_queue" "record_thumbnail_staging_queue" {
  name = "record-thumbnail-staging-queue"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.record_thumbnail_staging_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "record_thumbnail_staging_queue_policy" {
  queue_url = aws_sqs_queue.record_thumbnail_staging_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.record_thumbnail_staging_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.record_thumbnail_staging_topic.arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "record_thumbnail_staging_subscription" {
  topic_arn = aws_sns_topic.record_thumbnail_staging_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.record_thumbnail_staging_queue.arn
}

data "aws_iam_policy_document" "assume_role_staging" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "record_thumbnail_lambda_staging_role" {
  name               = "record-thumbnail-lambda-staging-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_staging.json
}

resource "aws_iam_role_policy" "record_thumbnail_lambda_staging_policy" {
  name = "record-thumbnail-lambda-staging-policy"
  role = aws_iam_role.record_thumbnail_lambda_staging_role.name
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
        ]
        Effect   = "Allow"
        Resource = ["*", aws_sqs_queue.record_thumbnail_staging_queue.arn]
      },
    ]
  })
}

resource "aws_lambda_function" "record_thumbnail_lambda_staging" {
  package_type  = "Image"
  image_uri     = local.desired_images["record-thumbnail-staging-lambda"]
  function_name = "record-thumbnail-staging-lambda"
  role          = aws_iam_role.record_thumbnail_lambda_staging_role.arn
  timeout       = 30

  vpc_config {
    security_group_ids = [var.staging_security_group_id]
    subnet_ids         = var.subnet_ids
  }

  environment {
    variables = {
      ENV                    = var.staging_env
      SENTRY_DSN             = var.sentry_dsn
      DATABASE_URL           = var.staging_database_url
      CLOUDFRONT_URL         = var.staging_cloudfront_url
      CLOUDFRONT_KEY_PAIR_ID = var.cloudfront_key_pair_id
      CLOUDFRONT_PRIVATE_KEY = var.cloudfront_private_key
    }
  }
}

resource "aws_lambda_event_source_mapping" "record_thumbnail_staging_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.record_thumbnail_staging_queue.arn
  function_name                      = aws_lambda_function.record_thumbnail_lambda_staging.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
}
