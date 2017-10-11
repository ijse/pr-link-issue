function detectIssueId (ref) {
    const reg = /^(feature|fix|hotfix|improve|solve|update)-(\d+)/i
    const matches = reg.exec(ref) || []
    return matches[2]
}

module.exports = robot => {
    robot.on('pull_request.opened', async context => {
        const pr = context.payload.pull_request
        const branchName = pr.head.ref

        const issueId = detectIssueId(branchName)
        if (!issueId) return

        const comment = context.issue({
            body: ` resolve #${issueId} `
        })

        // create comment
        return context.github.issues.createComment(comment)
    })
}
