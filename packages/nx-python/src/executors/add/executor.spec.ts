import { vi, MockInstance } from 'vitest';
import { vol } from 'memfs';
import '../../utils/mocks/cross-spawn.mock';
import '../../utils/mocks/fs.mock';
import * as poetryUtils from '../utils/poetry';
import executor from './executor';
import chalk from 'chalk';
import { parseToml } from '../utils/poetry';
import dedent from 'string-dedent';
import spawn from 'cross-spawn';
import { ExecutorContext } from '@nx/devkit';

describe('Add Executor', () => {
  let checkPoetryExecutableMock: MockInstance;
  let activateVenvMock: MockInstance;

  beforeAll(() => {
    console.log(chalk`init chalk`);
  });

  beforeEach(() => {
    checkPoetryExecutableMock = vi
      .spyOn(poetryUtils, 'checkPoetryExecutable')
      .mockResolvedValue(undefined);
    activateVenvMock = vi
      .spyOn(poetryUtils, 'activateVenv')
      .mockReturnValue(undefined);
    vi.mocked(spawn.sync).mockReturnValue({
      status: 0,
      output: [''],
      pid: 0,
      signal: null,
      stderr: null,
      stdout: null,
    });
    vi.spyOn(process, 'chdir').mockReturnValue(undefined);
  });

  afterEach(() => {
    vol.reset();
    vi.resetAllMocks();
  });

  it('should return success false when the poetry is not installed', async () => {
    checkPoetryExecutableMock.mockRejectedValue(new Error('poetry not found'));

    const options = {
      name: 'numpy',
      local: false,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).not.toHaveBeenCalled();
    expect(output.success).toBe(false);
  });

  it('run add target and should add the dependency to the project', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"

        [tool.poetry.group.dev.dependencies]
        pytest = "6.2.4"
      `,
    });

    const options = {
      name: 'numpy',
      local: false,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledWith('poetry', ['add', 'numpy'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });
    expect(output.success).toBe(true);
  });

  it('run add target and should add the dependency to the project group dev', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"

        [tool.poetry.group.dev.dependencies]
        pytest = "6.2.4"
      `,
    });

    const options = {
      name: 'numpy',
      local: false,
      group: 'dev',
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledWith(
      'poetry',
      ['add', 'numpy', '--group', 'dev'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(output.success).toBe(true);
  });

  it('run add target and should add the dependency to the project extras', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"

        [tool.poetry.group.dev.dependencies]
        pytest = "6.2.4"
      `,
    });

    const options = {
      name: 'numpy',
      local: false,
      extras: ['dev'],
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledWith(
      'poetry',
      ['add', 'numpy', '--extras=dev'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(output.success).toBe(true);
  });

  it('run add target and should not add the dependency to the project because the project does not exist', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': `[tool.poetry]
name = "app"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"
  click = "click"
`,
    });

    const options = {
      local: true,
      name: 'lib1',
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).not.toHaveBeenCalled();
    expect(output.success).toBe(false);
  });

  it('run add target and should throw an exception', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': `[tool.poetry]
name = "app"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"
  click = "click"
`,
    });

    vi.mocked(spawn.sync).mockImplementation(() => {
      throw new Error('fake error');
    });

    const options = {
      name: 'numpy',
      local: false,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledWith('poetry', ['add', 'numpy'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });
    expect(output.success).toBe(false);
  });

  it('run add target and should update all the dependency tree', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"
        lib1 = { path = "../../libs/lib1" }
      `,

      'apps/app1/pyproject.toml': dedent`
      [tool.poetry]
      name = "app1"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"
        lib1 = { path = "../../libs/lib1" }
      `,

      'libs/lib1/pyproject.toml': dedent`
      [tool.poetry]
      name = "lib1"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        shared1 = { path = "../shared1" }
      `,

      'libs/shared1/pyproject.toml': dedent`
      [tool.poetry]
      name = "shared1"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
      `,
    });

    const options = {
      name: 'numpy',
      local: false,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'shared1',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
          app1: {
            root: 'apps/app1',
            targets: {},
          },
          app3: {
            root: 'apps/app3',
            targets: {},
          },
          lib1: {
            root: 'libs/lib1',
            targets: {},
          },
          shared1: {
            root: 'libs/shared1',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledTimes(7);
    expect(spawn.sync).toHaveBeenNthCalledWith(1, 'poetry', ['add', 'numpy'], {
      cwd: 'libs/shared1',
      shell: false,
      stdio: 'inherit',
    });
    expect(spawn.sync).toHaveBeenNthCalledWith(
      2,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'libs/lib1',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(3, 'poetry', ['install'], {
      cwd: 'libs/lib1',
      shell: false,
      stdio: 'inherit',
    });
    expect(spawn.sync).toHaveBeenNthCalledWith(
      4,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(5, 'poetry', ['install'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });
    expect(spawn.sync).toHaveBeenNthCalledWith(
      6,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app1',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(7, 'poetry', ['install'], {
      cwd: 'apps/app1',
      shell: false,
      stdio: 'inherit',
    });
    expect(output.success).toBe(true);
  });

  it('run add target and should update all the dependency tree for dev dependencies', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"
        lib1 = { path = "../../libs/lib1" }
      `,

      'apps/app1/pyproject.toml': dedent`
      [tool.poetry]
      name = "app1"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"
        lib1 = { path = "../../libs/lib1" }
      `,

      'libs/lib1/pyproject.toml': dedent`
      [tool.poetry]
      name = "lib1"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.group.dev.dependencies]
        python = "^3.8"
        shared1 = { path = "../shared1" }
      `,

      'libs/shared1/pyproject.toml': dedent`
      [tool.poetry]
      name = "shared1"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
      `,
    });

    const options = {
      name: 'numpy',
      local: false,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'shared1',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
          app1: {
            root: 'apps/app1',
            targets: {},
          },
          app3: {
            root: 'apps/app3',
            targets: {},
          },
          lib1: {
            root: 'libs/lib1',
            targets: {},
          },
          shared1: {
            root: 'libs/shared1',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledTimes(7);
    expect(spawn.sync).toHaveBeenNthCalledWith(1, 'poetry', ['add', 'numpy'], {
      cwd: 'libs/shared1',
      shell: false,
      stdio: 'inherit',
    });
    expect(spawn.sync).toHaveBeenNthCalledWith(
      2,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'libs/lib1',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(3, 'poetry', ['install'], {
      cwd: 'libs/lib1',
      shell: false,
      stdio: 'inherit',
    });
    expect(spawn.sync).toHaveBeenNthCalledWith(
      4,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(5, 'poetry', ['install'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });
    expect(spawn.sync).toHaveBeenNthCalledWith(
      6,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app1',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(7, 'poetry', ['install'], {
      cwd: 'apps/app1',
      shell: false,
      stdio: 'inherit',
    });
    expect(output.success).toBe(true);
  });

  it('run add target with local dependency', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': `[tool.poetry]
name = "app"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"
  click = "click"`,

      'libs/lib1/pyproject.toml': `[tool.poetry]
name = "lib1"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"`,
    });

    const options = {
      name: 'lib1',
      local: true,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
          lib1: {
            root: 'libs/lib1',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledTimes(2);
    expect(spawn.sync).toHaveBeenNthCalledWith(
      1,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });
    expect(output.success).toBe(true);
  });

  it('run add target with local dependency with group dev', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': `[tool.poetry]
name = "app"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"
  click = "click"`,

      'libs/lib1/pyproject.toml': `[tool.poetry]
name = "lib1"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"`,
    });

    const options = {
      name: 'lib1',
      local: true,
      group: 'dev',
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
          lib1: {
            root: 'libs/lib1',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledTimes(2);
    expect(spawn.sync).toHaveBeenNthCalledWith(
      1,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });
    expect(output.success).toBe(true);
  });

  it('run add target with local dependency with extras', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"
      `,

      'libs/lib1/pyproject.toml': dedent`
      [tool.poetry]
      name = "lib1"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
      `,
    });

    const options = {
      name: 'lib1',
      local: true,
      extras: ['dev'],
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
          lib1: {
            root: 'libs/lib1',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledTimes(2);
    expect(spawn.sync).toHaveBeenNthCalledWith(
      1,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });
    expect(output.success).toBe(true);
  });

  it('run add target with local dependency with extras group dev', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"
      `,

      'libs/lib1/pyproject.toml': dedent`
      [tool.poetry]
      name = "lib1"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
      `,
    });

    const options = {
      name: 'lib1',
      local: true,
      group: 'dev',
      extras: ['dev'],
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
          lib1: {
            root: 'libs/lib1',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledTimes(2);
    expect(spawn.sync).toHaveBeenNthCalledWith(
      1,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });
    expect(output.success).toBe(true);
  });

  it('run add target with local dependency with project name and package name different', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': `[tool.poetry]
name = "dgx-devops-app"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"
  click = "click"`,

      'libs/lib1/pyproject.toml': `[tool.poetry]
name = "dgx-devops-lib1"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"`,
    });

    const options = {
      name: 'lib1',
      local: true,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
          lib1: {
            root: 'libs/lib1',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(output.success).toBe(true);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledTimes(2);
    expect(spawn.sync).toHaveBeenNthCalledWith(
      1,
      'poetry',
      ['lock', '--no-update'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
      cwd: 'apps/app',
      shell: false,
      stdio: 'inherit',
    });

    const {
      tool: {
        poetry: { dependencies },
      },
    } = parseToml('apps/app/pyproject.toml');

    expect(dependencies['dgx-devops-lib1']).toStrictEqual({
      path: '../../libs/lib1',
      develop: true,
    });
  });

  it('run add target and should add the dependency using custom args', async () => {
    vol.fromJSON({
      'apps/app/pyproject.toml': `[tool.poetry]
name = "app"
version = "1.0.0"
  [[tool.poetry.packages]]
  include = "app"

  [tool.poetry.dependencies]
  python = "^3.8"
  click = "click"
`,
    });

    const options = {
      name: 'numpy',
      local: false,
      args: '--group dev',
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenCalledWith(
      'poetry',
      ['add', 'numpy', '--group', 'dev'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(output.success).toBe(true);
  });

  it('run add target and should add the dependency to the project using --lock when the root pyproject.toml is present', async () => {
    vol.fromJSON({
      'pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"

        [tool.poetry.dependencies]
        python = "^3.8"
        app = { path = "apps/app", develop = true}
      `,
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"
      `,
    });

    const options = {
      name: 'numpy',
      local: false,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenNthCalledWith(
      1,
      'poetry',
      ['add', 'numpy', '--lock'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(
      2,
      'poetry',
      ['lock', '--no-update'],
      {
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(
      3,
      'poetry',
      ['install', '--no-root'],
      {
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(output.success).toBe(true);
  });

  it('run add target and should add the dependency to the project using --lock when the root pyproject.toml is present when project is grouped in root', async () => {
    vol.fromJSON({
      'pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"

        [tool.poetry.dependencies]
        python = "^3.8"

        [tool.poetry.group.foo.dependencies.app]
        path = "apps/app"
        develop = true
      `,
      'apps/app/pyproject.toml': dedent`
      [tool.poetry]
      name = "app"
      version = "1.0.0"
        [[tool.poetry.packages]]
        include = "app"

        [tool.poetry.dependencies]
        python = "^3.8"
        click = "click"
      `,
    });

    const options = {
      name: 'numpy',
      local: false,
    };

    const context: ExecutorContext = {
      cwd: '',
      root: '.',
      isVerbose: false,
      projectName: 'app',
      projectsConfigurations: {
        version: 2,
        projects: {
          app: {
            root: 'apps/app',
            targets: {},
          },
        },
      },
      nxJsonConfiguration: {},
      projectGraph: {
        dependencies: {},
        nodes: {},
      },
    };

    const output = await executor(options, context);
    expect(checkPoetryExecutableMock).toHaveBeenCalled();
    expect(activateVenvMock).toHaveBeenCalledWith('.');
    expect(spawn.sync).toHaveBeenNthCalledWith(
      1,
      'poetry',
      ['add', 'numpy', '--lock'],
      {
        cwd: 'apps/app',
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(
      2,
      'poetry',
      ['lock', '--no-update'],
      {
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(spawn.sync).toHaveBeenNthCalledWith(
      3,
      'poetry',
      ['install', '--no-root'],
      {
        shell: false,
        stdio: 'inherit',
      },
    );
    expect(output.success).toBe(true);
  });
});
