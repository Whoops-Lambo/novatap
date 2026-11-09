"""Validate archive structure and device target before distributing an IPA."""
import plistlib
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as archive:
    assert archive.testzip() is None, 'Corrupt ZIP data'
    info = plistlib.loads(archive.read('Payload/App.app/Info.plist'))
    assert 'iPhoneOS' in info.get('CFBundleSupportedPlatforms', []), 'Not an iPhone device build'
    executable = info['CFBundleExecutable']
    assert archive.getinfo(f'Payload/App.app/{executable}').file_size > 0, 'Missing executable'
    assert 'Payload/App.app/public/index.html' in archive.namelist(), 'Missing game assets'
    assert not any('/App.app/App.app/' in name for name in archive.namelist()), 'Nested app bundle'
print('IPA structure validated. Sideloadly must sign it before installation.')
