function detectIssueId (ref) {
    const reg = /^(feature|fix|improve|solve|tmp)-(\d+)/i
    const matches = reg.exec(ref) || []
    return matches[2]
}

console.log('pem:', process.env.PRIVATE_KEY)

module.exports = robot => {
    robot.on('pull_request.opened', async context => {
        const pr = context.payload.pull_request
        const branchName = pr.head.ref

        const issueId = detectIssueId(branchName)
        if (!issueId) return

        const comment = context.issue({
            body: `solve #${issueId}`
        })

        // create comment
        return context.github.issues.createComment(comment)
    })
}
