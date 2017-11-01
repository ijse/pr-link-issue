function detectIssueId (ref) {
    const reg = /^(feature|fix|hotfix|fixbug|bugfix|improve|solve|update)-(\d+)/i
    const matches = reg.exec(ref) || []
    return matches[2]
}

module.exports = robot => {
    robot.on('pull_request.opened', async context => {
        const repo = context.repo()
        const pr = context.payload.pull_request
        const branchName = pr.head.ref

        console.log('check pr: ', pr.number)
        // link with issue
        const issueId = detectIssueId(branchName)
        if (issueId) {
            const ctn = pr.body.replace(/resolve #(\d+)/g, '')
            const newIssue = context.issue({
                number: pr.number,
                body: ctn += `\n\n resolve #${issueId} `
            })

            console.log('link issue: ', issueId)
            // create comment
            context.github.issues.edit(newIssue)
        }

        // check milestone
        const isMilestoneSetted = !!pr.milestone
        if (!isMilestoneSetted) {
            context.github.issues.getMilestones(context.repo({
                state: 'open',
                sort: 'due_on',
                direction: 'desc',
                per_page: 3
            })).then(({ data: milestones })=> {
                console.log('milestone list:', milestones)
                if (milestones && milestones[0]) {
                    const curMilestone = milestones[0]

                    console.log('set milestone:', curMilestone)
                    // set milestone
                    context.github.issues.edit(context.issue({
                        number: pr.number,
                        milestone: curMilestone.number
                    }))
                }
            })
        }

        // set assignee
        const hasAssignee = !!pr.assignees.length
        if (!hasAssignee) {
            context.github.issues.edit(context.issue({
                number: pr.number,
                assignee: pr.user.login
            }))
        }

        // default set wip status
        const wipTitle = pr.title.replace(/\bwip\b/g, '') + ' wip'
        context.github.issues.edit(context.issue({
            number: pr.number,
            title: wipTitle
        }))
    })
}
