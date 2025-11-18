data "aws_lambda_function" "metadata_attacher_dev_lambda" {
  function_name = "metadata-attacher-dev-lambda"
}

resource "aws_sqs_queue" "metadata_attacher_dev_deadletter_queue" {
  name = "metadata-attacher-dev-deadletter-queue"
}

resource "aws_sqs_queue" "metadata_attacher_dev_queue" {
  name = "metadata-attacher-dev-queue"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.metadata_attacher_dev_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "metadata_attacher_dev_queue_policy" {
  queue_url = aws_sqs_queue.metadata_attacher_dev_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.metadata_attacher_dev_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.record_thumbnail_dev_topic.arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "metadata_attacher_dev_subscription" {
  topic_arn = aws_sns_topic.record_thumbnail_dev_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.metadata_attacher_dev_queue.arn
}

data "aws_iam_policy_document" "assume_dev_metadata_attacher_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "metadata_attacher_dev_lambda_role" {
  name               = "metadata-attacher-dev-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy" "metadata_attacher_dev_lambda_policy" {
  name = "metadata-attacher-lambda-policy"
  role = aws_iam_role.metadata_attacher_dev_lambda_role.name
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
        ]
        Effect   = "Allow"
        Resource = ["*", aws_sqs_queue.metadata_attacher_dev_queue.arn]
      },
    ]
  })
}

resource "aws_lambda_function" "metadata_attacher_dev_lambda" {
  package_type  = "Image"
  image_uri     = local.desired_images["metadata-attacher-dev-lambda"]
  function_name = "metadata-attacher-dev-lambda"
  role          = aws_iam_role.metadata_attacher_dev_lambda_role.arn
  timeout       = 30

  vpc_config {
    security_group_ids = [var.dev_security_group_id]
    subnet_ids         = var.subnet_ids
  }

  environment {
    variables = {
      ENV          = var.dev_env
      SENTRY_DSN   = var.sentry_dsn
      DATABASE_URL = var.dev_database_url
    }
  }
}

resource "aws_lambda_event_source_mapping" "metadata_attacher_dev_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.metadata_attacher_dev_queue.arn
  function_name                      = aws_lambda_function.metadata_attacher_dev_lambda.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
}
