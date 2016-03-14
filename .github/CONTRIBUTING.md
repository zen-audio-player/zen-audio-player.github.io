# Contributing Guidelines

## Contact

Join the chat room on Gitter
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/zen-audio-player/zen-audio-player.github.io?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## How to contribute

### Getting Started

0. [Fork the repo!](https://github.com/zen-audio-player/zen-audio-player.github.io#fork-destination-box)
0. Clone your fork of the repo: `git clone git@github.com:<YOUR-USERNAME>/zen-audio-player.github.io.git`.
0. Navigate to the project: `cd zen-audio-player.github.io`.
0. Install test dependencies: `npm install`.
0. If you've started working on an issue, leave a comment as it helps avoid duplicate work.
0. Make your changes.
0. Run the tests: `npm test`.
0. Run `git commit` and add your message describing what you have changed. If you have made changes that address an issue include the text `Closes #1` (where 1 would be the issue number) to your commit message.
0. Submit a [pull request](https://github.com/zen-audio-player/zen-audio-player.github.io/pulls) - Travis CI will run tests to make sure nothing broke.
0. In case the following occurs, skip to **[Syncing](#syncing)** below  
![out of sync](/.github/outofsync.png)
0. After you've had 1 PR merged, [@shakeelmohamed](http://github.com/shakeelmohamed) will add you to the organization. Then you can create any issues you work on before you start.

### Syncing  

This issue arises when the `master` branch of the upstream repository has been changed (i.e. new commits added) since you checked out a development branch. It can be resolved in the following manner -  
  
0. Click on the **command line instructions**  as shown in the image above. The instructions are also explained below.  
0. Navigate to the current working directory of your working project on the command line. 
0. Run `git remote` to determine the remote name, if you have multiple remotes configured, you can run `git remote` -v to also see the URLs associated with each remote. The remote you want will have a URL containing `github.com/zen-audio-player/zen-audio-player.github.io`.  
0. Use `git fetch upstream` to fetch the branches and their respective commits from the upstream repository and store them locally. Commits to the upstream `master` branch are stored in a local branch `upstream/master`.  
0. Check out your branch using `git checkout <your-branchname>`.  
0. Merge the changes from upstream/master into your branch using `git merge upstream/master`. This syncs your branch with the upstream repository, without losing your local changes.  
0. Now you can again push your local changes using `git push origin <your-branchname>`.

## Issues & Bug Reports

If you're seeing some unexpected behavior, please create an [issue on GitHub](https://github.com/zen-audio-player/zen-audio-player.github.io/issues) with the following information:

0. A screenshot
0. Browser
0. Browser version
0. Operating System
