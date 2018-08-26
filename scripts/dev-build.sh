#!/usr/bin/env bash
# Add users ssh-keys to agent for downloading private github repos
eval $(ssh-agent)
find /root/.ssh/ -type f -exec grep -l "PRIVATE" {} \; | xargs ssh-add &> /dev/null
yarn install
npx nodemon --watch src --ext ts --exec "npx gulp" --legacy-watch
