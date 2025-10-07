import type { IScheduler, SchedulerConfig, SchedulerSetupInstructions } from './interface';

/**
 * AWS scheduler using EventBridge scheduled rules
 * Requires manual setup in AWS infrastructure
 */
export class AWSScheduler implements IScheduler {
  private config: SchedulerConfig;
  private isScheduled = false;
  private setupInstructions: SchedulerSetupInstructions | null = null;

  constructor(config: SchedulerConfig = {}) {
    this.config = config;
  }

  async schedule(intervalMinutes: number, handler: () => Promise<void>): Promise<void> {
    const rateExpression = `rate(${intervalMinutes} minute${intervalMinutes > 1 ? 's' : ''})`;

    this.setupInstructions = {
      platform: 'AWS Lambda',
      message: `
⚠️ AWS EventBridge Setup Required

Create an EventBridge rule with CloudFormation/Terraform:

File: infrastructure.yml or .tf
      `.trim(),
      code: `
# CloudFormation
Resources:
  OAuthRefreshSchedule:
    Type: AWS::Events::Rule
    Properties:
      ScheduleExpression: "${rateExpression}"
      State: ENABLED
      Targets:
        - Arn: !GetAtt OAuthRefreshFunction.Arn
          Id: OAuthRefreshTarget

  OAuthRefreshFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: oauth-token-refresh
      Runtime: nodejs20.x
      Handler: index.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            // Import your OAuth instance
            const { oauth } = require('./oauth');
            await oauth.refreshExpiringTokens();
            return { statusCode: 200 };
          };

# Terraform Alternative
resource "aws_cloudwatch_event_rule" "oauth_refresh" {
  name                = "oauth-token-refresh"
  schedule_expression = "${rateExpression}"
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.oauth_refresh.name
  target_id = "OAuthRefreshTarget"
  arn       = aws_lambda_function.oauth_refresh.arn
}
      `.trim(),
      configFile: 'infrastructure.yml'
    };

    if (this.config.onSetupRequired) {
      this.config.onSetupRequired(this.setupInstructions);
    } else {
      console.warn(this.setupInstructions.message);
      console.warn('\nInfrastructure Code:');
      console.warn(this.setupInstructions.code);
    }

    this.isScheduled = true;
  }

  async cancel(): Promise<void> {
    this.isScheduled = false;
    console.log('[AWSScheduler] Scheduler cancelled (remove EventBridge rule)');
  }

  isActive(): boolean {
    return this.isScheduled;
  }

  getSetupInstructions(): SchedulerSetupInstructions | null {
    return this.setupInstructions;
  }
}
