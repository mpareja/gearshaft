const { createHash } = require('crypto')
const { StreamName } = require('../stream-name')

exports.getConsumerGroupMember = (streamName, consumerGroupSize) => {
  const cardinalId = StreamName.getCardinalId(streamName)
  return exports.assignIdToMember(cardinalId, consumerGroupSize)
}

// The following algorithm is a re-implementation of the message-db
// consumer group assignment algorithm
exports.assignIdToMember = (id, size) => {
  const buffer = createHash('md5').update(id).digest() // md5(hash_64.value)
  const buffer8 = buffer.slice(0, 8) // left('x' || md5(hash_64.value), 17)
  const hash64 = readBigInt64BE.apply(buffer8) // ::bit(64)::bigint

  const member = hash64 % BigInt(size) // eslint-disable-line no-undef

  // Math.abs avoids a bias for 0
  return Math.abs(Number(member))
}

// Conversion taken from Node.js v12. Don't want to force requirement
// of v12 yet, so just lift the code:
// https://github.com/nodejs/node/blob/923d8bc733262cf960b62a02f113cfb0412b5834/lib/internal/buffer.js#L140
function readBigInt64BE () {
  let offset = 0 // hard code to zero since this is what we need

  const first = this[offset]
  const last = this[offset + 7]

  const val = (first << 24) + // Overflow
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  return (BigInt(val) << BigInt(32)) + // eslint-disable-line no-undef
    BigInt(this[++offset] * 2 ** 24 + // eslint-disable-line no-undef
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last)
}
