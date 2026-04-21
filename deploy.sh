#!/bin/bash
set -e

ENV=$1

if [ "$ENV" != "prod" ] && [ "$ENV" != "staging" ]; then
  echo "Usage: ./deploy.sh [prod|staging]"
  exit 1
fi

BRANCH="deploy-$ENV"
CURRENT=$(git rev-parse --abbrev-ref HEAD)

echo "Deploying to $ENV ($BRANCH)..."

git checkout "$BRANCH"
git merge main --no-edit
git push origin "$BRANCH"

git checkout "$CURRENT"

echo "Done. Pipeline triggered on $BRANCH."
