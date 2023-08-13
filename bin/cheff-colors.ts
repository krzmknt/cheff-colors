#!/usr/bin/env node

import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { LambdaApiStack } from '../lib/lambda-stack'
import { LambdaCicdStack } from '../lib/cicd-stack'

interface Environment {
  projectName: string
  stageName: string
  githubBranchName: string
}

function strictlyGetStringContext(key: string): string {
  const value: unknown = app.node.tryGetContext(key)
  if (value && typeof value == 'string') {
    return value
  } else {
    throw new Error(`${key} must be string`)
  }
}

function strictlyGetObjectContext(key: string): object {
  const value: unknown = app.node.tryGetContext(key)
  if (value && typeof value == 'object') {
    return value
  } else {
    throw new Error(`${key} must be object`)
  }
}

const app = new cdk.App()
const stageName = strictlyGetStringContext('stageName')
const projectName = strictlyGetStringContext('projectName')
const env: Environment = strictlyGetObjectContext(stageName) as Environment
env.projectName = projectName
env.stageName = stageName
const githubOwnerName = strictlyGetStringContext('githubOwnerName')
const githubRepositoryName = strictlyGetStringContext('githubRepositoryName')
const codestarConnectionArn = strictlyGetStringContext('codestarConnectionArn')
const commitHash = app.node.tryGetContext('commitHash') as string | undefined

console.log('projectName', projectName)
console.log('stageName', stageName)
new LambdaCicdStack(app, `${projectName}-${stageName}-cicd`, {
  ...env,
  githubOwnerName,
  githubRepositoryName,
  codestarConnectionArn,
})

new LambdaApiStack(app, `${projectName}-${stageName}-api`, {
  ...env,
  commitHash,
})
