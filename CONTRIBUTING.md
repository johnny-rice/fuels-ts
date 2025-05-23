# Contributing To Fuel TypeScript SDK

Thanks for your interest in contributing to the Fuel TypeScript SDK!

This document outlines the process for installing dependencies, setting up for development and conventions for contributing.

# Finding Something to Work On

There are many ways in which you may contribute to the project, some of which involve coding knowledge and some which do not. A few examples include:

- Reporting bugs
- Adding new features or bugfixes for which there is already an open issue
- Making feature requests

Check out our [Help Wanted](https://github.com/FuelLabs/fuels-ts/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) or [Good First Issues](https://github.com/FuelLabs/fuels-ts/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) to find a suitable task.

If you are planning something big, for example, changes related to multiple components or changes to current behaviors, make sure to [open an issue](https://github.com/FuelLabs/fuels-ts/issues/new) to discuss with us before starting on the implementation.

If you find a vulnerability or suspect it may be a security issue, please read our [Security Policy](./SECURITY.md) and follow the instructions.

# Issue Prioritization

If you would like to create an issue, please use the relevant [issue template](https://github.com/FuelLabs/fuels-ts/issues/new/choose). This will allow us to correctly triage and prioritize it. Every externally submitted issue goes through the following process:

1. A new issue is created and is given the `triage` label
1. It is assigned to a core maintainer for investigation
1. Once the assigned core maintainer has completed their investigation, they remove the `triage` label and assign the relevant label to the issue i.e. `bug` , `feat`, `chore`, `docs`
1. The issue is assigned a milestone (e.g. `mainnet`, `post-launch`) and a prioritization label where `p0` is the highest priority and `p2` is the lowest priority
1. The issue is assigned for development and should be moved to `In Progress`
1. A pull request is made ready and the issue is now `In Review`
1. The pull request needs approval by 3 core maintainers, these can be found in the [CODEOWNERS file](https://github.com/FuelLabs/fuels-ts/blob/master/.github/CODEOWNERS)
1. It can then be merged to `master` and included in a release
1. The issue is closed automatically and it's status is moved to `Done`

> **Note:** If additional information is ever required by the assigned investigator then the `awaiting` label will be added to the issue, these means they require more information from the author. Any `awaiting` issue left unanswered for 2 weeks will go `stale` and will be closed.

# Setting up

```sh
git clone git@github.com:FuelLabs/fuels-ts.git
cd fuels-ts
pnpm install
pnpm build
```

# Developing

For building everything in watch-mode, run:

```sh
# build all projects in watch-mode
pnpm dev
```

File watching is done by `nodemon` for increased performance.

Check `nodemon.config.json` for all settings.

> **Note**: You can `pnpm dev` a single package:
>
> ```sh
> cd packages/abi-coder
> pnpm dev
> ```

# Using local sym-linked packages

First, we need to link our `fuels` package globally in our local `global pnpm store`:

```sh
cd fuels-ts/packages/fuels
pnpm link --global
```

Let's check it out:

```sh
pnpm list --global
```

Cool, now on the root directory of `my-local-project`:

```sh
cd my-local-project
pnpm link --global fuels
```

That's it — `my-local-project` is now using our local version of `fuels`.

The same can be done with all other packages:

```sh
cd fuels-ts/packages/wallet
pnpm link --global

# ...

pnpm list --global # validating

# ...

cd my-local-project
pnpm link --global @fuel-ts/wallet
```

> **Warning** When using local symlinked `fuels-ts` in `your-local-project`, remember to `pnpm build` the SDK whenever you change a source file to reflect the changes on `your-local-project`. To automate this, you can use `pnpm dev`, which will keep watching and compiling everything automatically while developing.

See also:

- [Developing](#developing)

# Working with Unreleased Forc and Fuel-Core Functionality

When you need to work with unreleased versions of `forc` or `fuel-core`, you can specify a git branch instead of a version number in the respective `VERSION` file.

## Using Unreleased Forc

To use an unreleased version of `forc`:

1.  **Edit the `VERSION` File**
    Open the `internal/forc/VERSION` file and replace the version number (e.g., `0.59.0`) with the desired git branch:

        ```text
        git:some/branch-name
        ```

1.  **Install and Build**
    To download and build `forc` from the specified branch after updating `VERSION` file, run:

        ```sh
        pnpm install
        pnpm build
        ```

The following directory will be updated or created: `internal/forc/sway-repo`

## Using Unreleased Fuel-Core

Similarly, to use an unreleased version of `fuel-core`:

1.  **Edit the `VERSION` file:**
    Open the `internal/fuel-core/VERSION` file and replace the version number with the desired git branch:

        ```text
        git:some/branch-name
        ```

1.  **Install and Build**
    To download and build `fuel-core` from the specified branch after updating `VERSION` file, run:

        ```sh
        pnpm install
        pnpm build
        ```

> [!Note]
> The `internal/forc/sway-repo` and `internal/fuel-core/fuel-core-repo` directory will contain a local clone of the Sway and Fuel Core repository respectively, at the specific version or git branch you have specified in the `internal/forc/VERSION` and `internal/fuel-core/VERSION` file.

## Unreleased Files and Directories Created After Installation

After running `pnpm install` and `pnpm build`, the following files and directories are created:

- Forc Repository:

  - Located at `internal/forc/sway-repo`.
  - Contains the source code for the version of `forc` you are using.

- Fuel-Core Repository:
  - Located at `internal/fuel-core/fuel-core-repo`.
  - Contains the source code for the version of `fuel-core` you are using.

## Switching Back to Standard Binaries

If you switch back to using standard binaries you might encounter issues where the SDK still uses the previously downloaded unreleased binaries.

To resolve the issue and ensure the SDK uses the correct binaries:

1. **Delete the downloaded repositories**

   ```sh
   rm -rf internal/forc/sway-repo
   rm -rf internal/fuel-core/fuel-core-repo
   ```

1. **Reinstall and build**
   ```sh
   pnpm install
   pnpm build
   ```

# Testing

In order to run tests locally, you can run the following commands:

```sh
# run pretest to ensure all test dependencies are built
pnpm pretest

# run all tests in a node environment
pnpm test

# you may also run tests in a browser environment
pnpm test:browser

# watch all tests
pnpm test:watch

# run tests for a specific package
pnpm test:filter packages/my-desired-package

# run tests for a specific file
pnpm test:filter packages/my-desired-package/src/my.test.ts

# run tests while passing other flags to sub-program
pnpm test -- --coverage --my-other-flag
```

# Benchmarking

We currently use `vitest` 's [bench utility](https://vitest.dev/api/#bench) to run benchmarks. You can run them in both the browser and node environments.

```sh
pnpm bench:node
```

```sh
# run benchmarks for a specific package
pnpm bench:node packages/my-desired-package
```

### CI Test

During the CI process an automated end-to-end (e2e) test is executed. This test is crucial as it simulates real-world scenarios on the current test-net, ensuring that the changeset maintains the expected functionality and stability.

The e2e test can be found at:
`packages/fuel-gauge/src/e2e-script.test.ts`

The B256 address of this wallet is `0x3463d9064f9128153b00072b4cc543f504372737d5dc04b29c9ebcf1b2a17ee7`. This address can be funded via the [faucet](https://faucet-testnet.fuel.network/).

If you want to run an e2e test locally, you can provide your own wallet address and private key. For obvious security reasons, the private key should not be shared.

These can be overridden by generating an environment file:

```sh
cp .env.example .env.test
```

And changing the below variables:

```sh
DEVNET_WALLET_PVT_KEY=0x...
TESTNET_WALLET_PVT_KEY=0x...
```

This will enable you to run the e2e test locally against the live network:

```sh
pnpm test:filter e2e-script
```

# Commit Convention

Before you create a Pull Request, please check whether your commits comply with
the commit conventions used in this repository.

When you create a commit we kindly ask you to follow the convention
`category(scope or module): message` in your commit message while using one of
the following categories:

- `feat`: all changes that introduce completely new code or new
  features
- `fix`: changes that fix a bug (ideally you will additionally reference an
  issue if present)
- `docs`: changing existing or creating new documentation (i.e. README, docs for
  usage of a lib or cli usage)
- `build`: all changes regarding the build of the software, changes to
  dependencies or the addition of new dependencies
- `test`: all changes regarding tests (adding new tests or changing existing
  ones)
- `ci`: all changes regarding the configuration of continuous integration (i.e.
  github actions, ci system)
- `chore`: all changes to the repository that do not fit into any of the above
  categories

# Steps to PR

1. Fork the fuels-ts repository and clone your fork

2. Create a new branch out of the `master` branch with the naming convention `<username>/<fix|feat|chore|build|docs>/<branch-name>`.

3. Make and commit your changes following the
   [commit convention](https://github.com/FuelLabs/fuels-ts/blob/master/README.md#commit-convention).
   As you develop, you can run `pnpm build` and
   `pnpm test` to make sure everything works as expected.

4. Run `pnpm changeset` to create a detailed description of your changes. This
   will be used to generate a changelog when we publish an update.
   [Learn more about Changeset](https://github.com/changesets/changesets/tree/main/packages/cli).
   Please note that you might have to run `git fetch origin master` (where
   origin will be your fork on GitHub) before `pnpm changeset` works.

5. We adhere to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for semantic versioning, and given that we currently do not have a major release yet, only breaking changes would require a `minor` version bump. All other API compatible changes would be a `patch` version bump.

> If you made minor changes like CI config, prettier, etc, you can run
> `pnpm changeset add --empty` to generate an empty changeset file to document
> your changes.

# Git Hooks

The SDK utilizes a pre-push git hook to validate your contribution before review. This is a script that will run automatically before changes are pushed to the remote repository. Within the SDK, the pre-push script will run code linting.

> This can be overridden using the `--no-verify` flag when pushing.

# Updating Forc version

The following script will upgrade Forc to the latest version on GitHub, remove all lockfiles so the latest stdlib can be used, and rebuild all projects:

```sh
pnpm forc:update
```

After this you should run tests and fix any incompatibilities.

# Updating Fuel Core version

Manually edit the `internal/fuel-core/VERSION` file, add the right version, and then:

```sh
pnpm install # will download new binaries
pnpm test
```

If all tests pass, that's it.

Otherwise, you have work to do.

# Patching old releases

The following example is for releasing a patch for `v0.69.0` -> `v0.69.1`.

- Checkout the release commit via its tag and create a release branch based on it (`git checkout -b release/0.69.0 v0.69.0 && git push --set-upstream origin release/0.69.0`)
- Create PRs with base set to that release branch
  - When the PR is merged, a changeset PR is created
  - When the changeset PR is merged into the release branch, the next patch version is released and the commit is tagged (e.g. `v0.69.1`)
- After release, the release branch will be automatically deleted

# Patching latest release

Imagine the scenario:

1. We release `v0.80.0`
1. One day later, we have a new changesets PR that will bump things to `v0.81.0`
1. Before releasing `v0.81.0`, we find an issue and need to make a `v0.80.1` patch

We'd follow the same approach as explained in the [Patching old releases](#patching-old-releases) section above, bearing in mind the following after the release:

- A PR merging the `latest` release's branch into `master` will be automatically created,
- The automatically-created PR **must** be merged as soon as possible in order to
  - have the versions of packages on `master` match the `latest` released package versions,
  - have the released functionality on `master` as well

# Network Testing

The network test suite is designed to run locally against a specified network for validation purposes.

You can find the test suite at: `packages/fuel-gauge/src/network.test.ts`.

### Setup Instructions

Before running the tests, you need to configure the `.env` file:

1. Copy the `.env.example` file:

```sh
cp .env.example .env
```

2. Set the values for the following environment variables in the `.env` file:

```env
NETWORK_TEST_URL=https://testnet.fuel.network/v1/graphql
NETWORK_TEST_PVT_KEY=0x...
```

- `NETWORK_TEST_URL`: The URL of which network the test should run (e.g., Fuel Testnet endpoint).
- `NETWORK_TEST_PVT_KEY`: Your private key for the network.

### Running the Test Suite

Once the environment is set up, run the network tests using the following command:

```sh
pnpm test:network
```

# Transaction Time Measure

A script designed to run locally is available to measure the time required to submit and process different types of transactions on a specified network.

The script code is located at: `packages/fuel-gauge/scripts/latency-detection/main.ts`.

### Setup Instructions

Before running the tests, you need to configure the `.env` file:

1. Copy the `.env.example` file:

```sh
cp .env.example .env
```

2. Set the values for the following environment variables in the `.env` file:

```env
PERFORMANCE_ANALYSIS_TEST_URL=https://testnet.fuel.network/v1/graphql
PERFORMANCE_ANALYSIS_PVT_KEY=...
```

- `PERFORMANCE_ANALYSIS_TEST_URL`: The URL of which network the test should run (e.g., Fuel Testnet endpoint).
- `PERFORMANCE_ANALYSIS_PVT_KEY`: Your private key for the network.

### Running the Test Suite

Once your environment is configured, run the operations with:

```sh
pnpm tx:perf
```

By default, each operation is executed once. To run the operation multiple times and calculate an average execution time, use the `--execution-count` flag:

```sh
pnpm tx:perf -- --execution-count 10
```

In this example, each operation will be executed 10 times, and the reported time will be the average across all runs.

### Output and Results

The test results are saved in the snapshots directory as a CSV file. The filename follows a timestamp format, such as:

```
2025-01-23T13:23.csv
```

A sample of the results is shown below:

| Tag                              | Time (in seconds) |
| -------------------------------- | ----------------- |
| `simple-transfer`                | 1.907             |
| `missing-4x-output-variable`     | 2.866             |
| `inter-contract-call`            | 2.159             |
| `predicate-signature-validation` | 2.142             |

### Notes on Transaction Types

- `simple-transfer`: A basic transfer between two accounts.
- `missing-4x-output-variable`: Transfers assets to four recipients without specifying `OutputVariable`, resulting in four additional dry runs during estimation.
- `inter-contract-call`: Executes a script that calls a contract function, which then calls another contract function. Contracts inputs and outputs are not explicitly provided and are going to be resolved during estimation.
- `predicate-signature-validation`: Executes a transfer using a predicate that verifies a signature included in the transaction's witnesses. This mimics how non-native wallet connectors operate.

# FAQ

### Why is the prefix `fuels` and not `fuel`?

In order to make the SDK for Fuel feel familiar with those coming from the [ethers.js](https://github.com/ethers-io/ethers.js) ecosystem, this project opted for an `s` at the end.

The `fuels-*` family of SDKs is inspired by The Ethers Project.
