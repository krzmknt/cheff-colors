import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as codeBuild from 'aws-cdk-lib/aws-codebuild'
import * as codePipeline from 'aws-cdk-lib/aws-codepipeline'
import * as codePipelineActions from 'aws-cdk-lib/aws-codepipeline-actions'
import * as iam from 'aws-cdk-lib/aws-iam'

export interface LambdaCicdStackProps extends StackProps {
  projectName: string
  stageName: string
  githubOwnerName: string
  githubRepositoryName: string
  githubBranchName: string
  codestarConnectionArn: string
}

export class LambdaCicdStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaCicdStackProps) {
    super(scope, id, props)

    // Parse props
    const {
      projectName,
      stageName,
      githubOwnerName,
      githubRepositoryName,
      githubBranchName,
      codestarConnectionArn,
    } = props

    // ==========================================
    // CodePipeline Source action
    // ------------------------------------------
    const sourceArtifact = new codePipeline.Artifact()
    const sourceAction = new codePipelineActions.CodeStarConnectionsSourceAction({
      actionName: 'source',
      owner: githubOwnerName,
      repo: githubRepositoryName,
      branch: githubBranchName,
      connectionArn: codestarConnectionArn,
      output: sourceArtifact,
    })

    // ==========================================
    // CodeBuild Role
    // ------------------------------------------
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      path: '/',
      inlinePolicies: {
        codeBuildServicePolicies: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['cloudformation:*'],
              resources: [
                `arn:aws:cloudformation:${this.region}:${this.account}:stack/*`,
              ],
            }),

            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter'],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/*`,
              ],
            }),

            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:*'],
              resources: [
                `arn:aws:s3:::cdk-*-assets-${this.account}-${this.region}`,
                `arn:aws:s3:::cdk-*-assets-${this.account}-${this.region}/*`,
                'arn:aws:s3:::cdktoolkit-stagingbucket-*',
              ],
            }),

            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['iam:PassRole'],
              resources: [
                `arn:aws:iam::${this.account}:role/cdk-*-role-${this.account}-${this.region}`,
              ],
            }),
          ],
        }),
      },
    })

    // ==========================================
    // CodeBuild Project
    // ------------------------------------------
    const codeBuildPipelineProject = new codeBuild.PipelineProject(
      this,
      'CodeBuildProject',
      {
        projectName: `${projectName}-${stageName}-project`,
        buildSpec: codeBuild.BuildSpec.fromSourceFilename('./buildspec.yml'),
        role: codeBuildRole,
        environment: {
          buildImage: codeBuild.LinuxBuildImage.STANDARD_5_0,
          computeType: codeBuild.ComputeType.SMALL,
          privileged: true,
          environmentVariables: {
            STAGE_NAME: {
              type: codeBuild.BuildEnvironmentVariableType.PLAINTEXT,
              value: stageName,
            },
            PROJECT_NAME: {
              type: codeBuild.BuildEnvironmentVariableType.PLAINTEXT,
              value: projectName,
            },
          },
        },
      },
    )

    // ==========================================
    // CodePipeline Deploy action
    // ------------------------------------------
    const buildDeployAction = new codePipelineActions.CodeBuildAction({
      actionName: 'build-deploy',
      project: codeBuildPipelineProject,
      input: sourceArtifact,
    })

    new codePipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${projectName}-${stageName}-pipeline`,
      stages: [
        {
          stageName: 'source',
          actions: [sourceAction],
        },
        {
          stageName: 'build-deploy',
          actions: [buildDeployAction],
        },
      ],
    })
  }
}
