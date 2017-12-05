const axios = require('axios')

function detectIssueId (ref) {
    const reg = /^(feature|fix|hotfix|fixbug|bugfix|improve|solve|update)-(\d+)/i
    const matches = reg.exec(ref) || []
    return matches[2]
}

const USERMAP = {
    'ijse': '@清凌渡',
    'wang-jia': '@王佳',
    'gao-jx': '@jianxun gao',
    'liushumei': '@刘淑美'
}

module.exports = robot => {
    robot.on('pull_request.review_requested', async context => {
        const pr = context.payload.pull_request
        const reviewers = pr.requested_reviewers.map(r => r.login)
        const url = pr.html_url
        const reviewersList = reviewers.map(r => USERMAP[r]).join(' ')
        axios.post('http://bot.ijser.cn/api/ding', {
            to: 'fe',
            msg: `${USERMAP[pr.sender.login]} 喊 ${reviewersList} 来Review代码 ${url} !`
        })
    })
    robot.on('pull_request.opened', async context => {
        const repo = context.repo()
        const pr = context.payload.pull_request
        const branchName = pr.head.ref

        pr.body = pr.body || ''
        console.log('check pr: ', pr.number)
        // link with issue
        const issueId = detectIssueId(branchName)
        if (issueId) {
            const ctn = pr.body.replace(/resolve #(\d+)/g, '')
            const newIssue = context.issue({
                number: pr.number,
                body: ctn + `\n\n resolve #${issueId} `
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

        // add labels
        const isFeature = /\[adde?d?\]/ig.test(pr.title)
        const isBug = /\[fixe?d?\]/ig.test(pr.title)
        const isImprove = /\[improve.*\]/ig.test(pr.title)
        const labels = []
        if (isFeature) labels.push('type:feature')
        if (isBug) labels.push('type:bug')
        if (isImprove) labels.push('type:improvement')
        context.github.issues.addLabels(context.repo({
            number: pr.number,
            labels: labels
        }))
    })
}
