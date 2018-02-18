### Getting Started

0. [Fork the repo!](https://github.com/zen-audio-player/zen-audio-player.github.io#fork-destination-box)
0. Clone your fork of the repo: `git clone git@github.com:<YOUR-USERNAME>/zen-audio-player.github.io.git`.
0. Navigate to the project: `cd zen-audio-player.github.io`.
0. Install test dependencies: `npm install`.
0. If you've started working on an issue, leave a comment as it helps avoid duplicate work.
0. Create a branch(whose name reflect the issue you are working on) and make your changes.
0. Run the tests: `npm test`.
0. Run `git commit` and add your message describing what you have changed. If you have made changes that address an issue include the text `Closes #1` (where 1 would be the issue number) to your commit message.
0. Submit a [pull request](https://github.com/zen-audio-player/zen-audio-player.github.io/pulls) - Travis CI will run tests to make sure nothing broke. Once you have committed your changes locally and pushed them to your fork of the repo, a banner with a **Compare & pull request** button should appear on the main Zen Audio Player repo page to submit a pull request. The `base fork` is this repo, and the `base` is master. The `head fork` is your clone of the repo, and under `compare`, choose the branch that you created in step 6.
![submit pr](/.github/submit_pr.png)
0. In case the following occurs, visit the Syncing section below.
![out of sync](/.github/outofsync.png)
0. After you've had 1 PR merged, [@shakeelmohamed](http://github.com/shakeelmohamed) will add you to the organization. Then you can create any issues you work on before you start.

### Syncing  

This issue arises when the `master` branch of the upstream repository has been changed (i.e. new commits added) since you checked out a development branch. It can be resolved in the following manner -  
  
0. Click on the **command line instructions**  as shown in the image above. The instructions are also explained below.  
0. Navigate to the current working directory of your working project on the command line. 
0. Run `git remote` to determine the remote name, if you have multiple remotes configured, you can run `git remote -v` to also see the URLs associated with each remote. The remote you want will have a URL containing `github.com/zen-audio-player/zen-audio-player.github.io`.  
0. Use `git fetch upstream` to fetch the branches and their respective commits from the upstream repository and store them locally. Commits to the upstream `master` branch are stored in a local branch `upstream/master`.  
0. Check out your branch using `git checkout <your-branchname>`.  
0. Merge the changes from upstream/master into your branch using `git merge upstream/master`. This syncs your branch with the upstream repository, without losing your local changes.  
0. Now you can again push your local changes using `git push origin <your-branchname>`.

### Issues & Bug Reports

* Before you open an issue, please check if a similar issue already exists or has been closed before.

If you're seeing some unexpected behavior, please create an [issue on GitHub](https://github.com/zen-audio-player/zen-audio-player.github.io/issues) with the following information:

- [ ] A general summary of the issue in the **Title**.  
- [ ] Screenshot
- [ ] The browser, browser version and the operating system you're using
- [ ] The behavior you expect to see, the actual behavior, and the steps to reproduce the behavior 
- [ ] \(optional) Possible solution/fix/workaround

## When you open an issue for a change/improvement/feature request:
- [ ] A description of the problem you're trying to solve, including _why_ you think this is a problem
- [ ] If the feature changes current behavior, reasons why your solution is better

### Pull Requests

When submitting a pull request:

* Provide a general summary of your changes in the **Title**.

## Motivation and Context
- [ ] Why is this change required? What problem does it solve? If it fixes an open issue, include the text `Closes #1` (where 1 would be the issue number) to your commit message.

## Types of changes
What types of changes does your code introduce? Check all the boxes that apply:
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

## Change details
- [ ] Describe your changes in detail.

## Final checklist:
Go over all the following points and check all the boxes that apply  
If you're unsure about any of these, don't hesitate to ask. We're here to help!
- [ ] My code follows the code style of this project.
- [ ] My change requires a change to the documentation.
- [ ] I have updated the documentation accordingly.
- [ ] I have read the [**Making Contributions**](https://github.com/zen-audio-player/zen-audio-player.github.io/wiki/Making-Contributions) guideline on the wiki pages.
- [ ] All tests passed.