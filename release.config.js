module.exports = {
    branches: [
      // 🟩 Production branch (stable releases)
      { name: "master", channel: "latest", range: "0.x" },

      // 🟧 Dedicated release branch (major versions or stable milestones)
      { name: "release", channel: "release" },

      // 🟦 Automated dependency update branch
      { name: "build-deps-upgrade-npm-packages-automated", channel: "deps" }
    ],

    plugins: [
      // 🔍 Analyze commit messages following Conventional Commits
      [
        "@semantic-release/commit-analyzer",
        {
          preset: "conventionalcommits",
          releaseRules: [
            // Conventional Commit types mapped to semantic bumps
            { type: "feat", release: "minor" },
            { type: "fix", release: "patch" },
            { type: "perf", release: "patch" },
            { type: "revert", release: "patch" },

            // Documentation and non-code changes → no release
            { type: "docs", release: false },
            { type: "style", release: false },
            { type: "test", release: false },
            { type: "ci", release: false },
            { type: "refactor", release: false },

            // Custom rules to mimic your old version-bumper behavior
            { type: "build", release: "patch" },
            { type: "chore", release: "patch" },
            { scope: "deps", release: "minor" },

            // BREAKING CHANGE always results in a major bump
            { breaking: true, release: "major" }
          ],
          parserOpts: {
            noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"]
          }
        }
      ],

      // 🧾 Generate detailed release notes
      "@semantic-release/release-notes-generator",

      // 🪵 Update changelog file automatically
      [
        "@semantic-release/changelog",
        {
          changelogFile: "CHANGELOG.md",
          changelogTitle: "# 📦 Changelog"
        }
      ],

      // 💾 Commit the updated files back to the repository
      [
        "@semantic-release/git",
        {
          assets: ["package.json", "package-lock.json", "CHANGELOG.md"],
          message:
            "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }
      ],

      // 🚀 Create a GitHub Release with changelog & assets
      [
        "@semantic-release/github",
        {
          assets: [{ path: "CHANGELOG.md", label: "Changelog" }],
          addReleases: true,  // disable automatic PR comments
          successComment: false, // disable success comment on PR
          failComment: false, // disable fail comment
          addLabels: false // disable labels
        }
      ]
    ]
  };
