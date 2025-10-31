resource "aws_sqs_queue" "metadata_attacher_deadletter_queue" {
  name = "metadata-attacher-deadletter-queue"
}

resource "aws_sqs_queue" "metadata_attacher_queue" {
  name = "metadata-attacher-queue"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.metadata_attacher_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "metadata_attacher_queue_policy" {
  queue_url = aws_sqs_queue.metadata_attacher_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.metadata_attacher_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.record_thumbnail_topic.arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "metadata_attacher_subscription" {
  topic_arn = aws_sns_topic.record_thumbnail_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.metadata_attacher_queue.arn
}

data "aws_iam_policy_document" "assume_metadata_attacher_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "metadata_attacher_lambda_role" {
  name               = "metadata-attacher-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy" "metadata_attacher_lambda_policy" {
  name = "metadata-attacher-lambda-policy"
  role = aws_iam_role.metadata_attacher_lambda_role.name
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
        Resource = ["*", aws_sqs_queue.metadata_attacher_queue.arn]
      },
    ]
  })
}

resource "aws_lambda_function" "metadata_attacher_lambda" {
  package_type  = "Image"
  image_uri     = var.metadata_attacher_lambda_image
  function_name = "metadata-attacher-lambda"
  role          = aws_iam_role.metadata_attacher_lambda_role.arn
  timeout       = 30

  vpc_config {
    security_group_ids = [var.prod_security_group_id]
    subnet_ids         = var.subnet_ids
  }

  environment {
    variables = {
      ENV          = var.env
      SENTRY_DSN   = var.sentry_dsn
      DATABASE_URL = var.prod_database_url
    }
  }
}

resource "aws_lambda_event_source_mapping" "metadata_attacher_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.metadata_attacher_queue.arn
  function_name                      = aws_lambda_function.metadata_attacher_lambda.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
}
