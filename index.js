function detectIssueId (ref) {
    const reg = /^(feature|fix|hotfix|improve|solve|update)-(\d+)/i
    const matches = reg.exec(ref) || []
    return matches[2]
}

module.exports = robot => {
    robot.on('pull_request.opened', async context => {
        const repo = context.repo()
        const pr = context.payload.pull_request
        const branchName = pr.head.ref

        // link with issue
        const issueId = detectIssueId(branchName)
        if (issueId) {
            const comment = context.issue({
                body: ` resolve #${issueId} `
            })

            // create comment
            context.github.issues.createComment(comment)
        }

        // check milestone
        const isMilestoneSetted = !!pr.milestone
        if (!isMilestoneSetted) {
            const milestones = context.github.issues.getMilestones(context.repo({
                state: 'open',
                sort: 'due_on',
                direction: 'desc',
                per_page: 1
            }))
            if (milestone && milestone[0]) {
                const curMilestone = milestone[0]

                // set milestone
                const pr = context.issues()
                context.github.issues.edit(context.issue({
                    milestone: curMilestone.number
                }))
            }
        }
    })
}
