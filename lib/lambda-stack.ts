import * as path from 'path'

import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
// import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'

interface LambdaApiStackProps extends StackProps {
  projectName: string
  stageName: string
  commitHash?: string
}

export class LambdaApiStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaApiStackProps) {
    super(scope, id, props)
    const { projectName, stageName, commitHash } = props

    // function
    const lambdaFunction = new lambda.DockerImageFunction(this, 'LambdaFunction', {
      functionName: `${stageName}-${projectName}-lambda`,
      description: commitHash ? `Commit Hash: ${commitHash}` : '',
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../src')),
      currentVersionOptions: {
        removalPolicy: stageName === 'dev' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      },
    })

    // alias
    const lambdaAlias = lambdaFunction.currentVersion.addAlias('deployed-version')

    // api gateway
    // const restApi = new apigateway.RestApi(this, 'RestApi', {
    //   restApiName: `${stageName}-${projectName}-api`,
    // })
    // restApi.root.addMethod('GET', new apigateway.LambdaIntegration(lambdaAlias))
  }
}
