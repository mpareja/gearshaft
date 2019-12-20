const si = require('systeminformation')

exports.getSystemInfo = async () => {
  const os = await si.osInfo()
  const cpu = await si.cpu()
  return {
    cpu,
    os: {
      platform: os.platform,
      distro: os.distro,
      release: os.release,
      kernel: os.kernel,
      arch: os.arch,
      servicepack: os.servicepack
    },
    node: process.version
  }
}
