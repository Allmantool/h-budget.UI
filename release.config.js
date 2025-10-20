module.exports = {
    branches: [
      { name: "master", channel: "latest", range: "0.x" },
      { name: "release", channel: "latest" },
      { name: "build-deps-upgrade-npm-packages-automated", channel: "deps" }
    ],
    tagFormat: "${version}",
    plugins: [
      [
        "@semantic-release/commit-analyzer",
        {
          preset: "conventionalcommits",
          releaseRules: [
            { type: "feat", release: "minor" },
            { type: "fix", release: "patch" },
            { type: "perf", release: "patch" },
            { type: "revert", release: "patch" },
            { type: "docs", release: false },
            { type: "style", release: false },
            { type: "test", release: false },
            { type: "ci", release: false },
            { type: "refactor", release: false },
            { type: "build", release: "patch" },
            { type: "chore", release: "patch" },
            { scope: "deps", release: "minor" },
            { breaking: true, release: "major" }
          ],
          parserOpts: {
            noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"]
          }
        }
      ],
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/changelog",
        {
          changelogFile: "CHANGELOG.md",
          changelogTitle: "# 📦 Changelog"
        }
      ],
      [
        "@semantic-release/git",
        {
          assets: ["package.json", "package-lock.json", "CHANGELOG.md"],
          message:
            "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }
      ],
      [
        "@semantic-release/github",
        {
          assets: [{ path: "CHANGELOG.md", label: "Changelog" }],
          successComment: false,
          failComment: false,
          addLabels: false
        }
      ]
    ]
  };
