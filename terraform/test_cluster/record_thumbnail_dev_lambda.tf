resource "aws_sns_topic" "record_thumbnail_dev_topic" {
  name = "record-thumbnail-dev-topic"
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
            "AWS:SourceArn" = "arn:aws:s3:*:*:permanent-dev"
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue" "record_thumbnail_dev_deadletter_queue" {
  name = "record-thumbnail-dev-deadletter-queue"
}

resource "aws_sqs_queue" "record_thumbnail_dev_queue" {
  name = "record-thumbnail-dev-queue"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.record_thumbnail_dev_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "record_thumbnail_dev_queue_policy" {
  queue_url = aws_sqs_queue.record_thumbnail_dev_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.record_thumbnail_dev_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.record_thumbnail_dev_topic.arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "record_thumbnail_dev_subscription" {
  topic_arn = aws_sns_topic.record_thumbnail_dev_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.record_thumbnail_dev_queue.arn
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "record_thumbnail_dev_lambda_role" {
  name               = "record-thumbnail-dev-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy" "record_thumbnail_dev_lambda_policy" {
  name = "record-thumbnail-lambda-policy"
  role = aws_iam_role.record_thumbnail_dev_lambda_role.name
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
        Resource = ["*", aws_sqs_queue.record_thumbnail_dev_queue.arn]
      },
    ]
  })
}

resource "aws_lambda_function" "record_thumbnail_dev_lambda" {
  package_type  = "Image"
  image_uri     = var.record_thumbnail_dev_lambda_image
  function_name = "record-thumbnail-dev-lambda"
  role          = aws_iam_role.record_thumbnail_dev_lambda_role.arn
  timeout       = 30

  vpc_config {
    security_group_ids = [var.dev_security_group_id]
    subnet_ids         = var.subnet_ids
  }

  environment {
    variables = {
      ENV                    = var.dev_env
      SENTRY_DSN             = var.sentry_dsn
      DATABASE_URL           = var.dev_database_url
      CLOUDFRONT_URL         = var.dev_cloudfront_url
      CLOUDFRONT_KEY_PAIR_ID = var.cloudfront_key_pair_id
      CLOUDFRONT_PRIVATE_KEY = var.cloudfront_private_key
    }
  }
}

resource "aws_lambda_event_source_mapping" "record_thumbnail_dev_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.record_thumbnail_dev_queue.arn
  function_name                      = aws_lambda_function.record_thumbnail_dev_lambda.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
}
