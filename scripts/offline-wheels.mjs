import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

export function windowsWheels(requirements) {
  const temp = fs.realpathSync(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(temp, 'demo-wheels-'));
  const executable = process.platform === 'win32' ? 'py' : 'python3';
  const args = process.platform === 'win32' ? ['-3.12'] : [];
  try {
    execFileSync(executable, [...args, '-m', 'pip', 'download', '--disable-pip-version-check',
      '--only-binary=:all:', '--platform', 'win_amd64', '--python-version', '3.12',
      '--implementation', 'cp', '--abi', 'cp312', '--dest', directory, '-r', requirements,
      'colorama==0.4.6'], {stdio: 'inherit'});
    return Object.fromEntries(fs.readdirSync(directory).filter(name => name.endsWith('.whl')).map(name =>
      [`wheels/${name}`, fs.readFileSync(path.join(directory, name))]));
  } finally {
    if (path.dirname(fs.realpathSync(directory)) === temp) fs.rmSync(directory, {recursive: true});
  }
}
