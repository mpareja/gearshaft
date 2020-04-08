const { exampleCategory, exampleStreamName, exampleWriteMessageData, StreamName } = require('../../message-store')
const { HandledMessageClass, setupConsumerWithHandler } = require('./setup-consumer-with-handler')

describe('category with streams assigned to 2 different members', () => {
  const setupTwoMemberStreams = async (category, messageStore) => {
    // 'A' and 'C' were chosen because consistent hashing
    // puts them in different groups for a size of 2
    const streamNameA = StreamName.create(category, 'A')
    const streamNameC = StreamName.create(category, 'C')

    const firstA = exampleWriteMessageData({ type: HandledMessageClass.name })
    const secondA = exampleWriteMessageData({ type: HandledMessageClass.name })
    const firstC = exampleWriteMessageData({ type: HandledMessageClass.name })
    const secondC = exampleWriteMessageData({ type: HandledMessageClass.name })

    // interleave to ensure awaiting 2 doesn't accidentally pick
    // the correct subset of messages
    await messageStore.write(firstA, streamNameA)
    await messageStore.write(firstC, streamNameC)
    await messageStore.write(secondA, streamNameA)
    await messageStore.write(secondC, streamNameC)

    return {
      category,
      messageStore,

      streamNameA,
      firstA,
      secondA,

      streamNameC,
      firstC,
      secondC
    }
  }

  it('processes first member messages', async () => {
    const { category, consumer, handler, messageStore } =
      setupConsumerWithHandler({ identifier: '0', groupMember: 0, groupSize: 2 })

    const { firstA, secondA } = await setupTwoMemberStreams(category, messageStore)

    const runner = consumer.start()
    await handler.waitUntilCalledAtLeast(2)
    await runner.stop()

    expect(handler.calls).toMatchObject([firstA.data, secondA.data])
  })

  it('processes second member messages', async () => {
    const { category, consumer, handler, messageStore } =
      setupConsumerWithHandler({ identifier: '1', groupMember: 1, groupSize: 2 })

    const { firstC, secondC } = await setupTwoMemberStreams(category, messageStore)

    const runner = consumer.start()
    await handler.waitUntilCalledAtLeast(2)
    await runner.stop()

    expect(handler.calls).toMatchObject([firstC.data, secondC.data])
  })
})

describe("some messages have matching correlation stream name, some don't", () => {
  const setupMixedCorrelation = async () => {
    const correlation = exampleCategory()

    const { consumer, handler, messageStore, category: consumedCategory } =
      setupConsumerWithHandler({ correlation })

    // note: interleaving first and second correlated messages to ensure
    // waitUntilCalledAtLeast(2) isn't accidentally responsible for matching
    // on the wrong subset of messages
    const noCorrelation = exampleWriteMessageData({ type: HandledMessageClass.name })

    const firstCorrelated = exampleWriteMessageData({ type: HandledMessageClass.name })
    firstCorrelated.metadata.correlationStreamName = exampleStreamName(correlation)

    const otherCorrelation = exampleWriteMessageData({ type: HandledMessageClass.name })
    otherCorrelation.metadata.correlationStreamName = exampleStreamName()

    const secondCorrelated = exampleWriteMessageData({ type: HandledMessageClass.name })
    secondCorrelated.metadata.correlationStreamName = exampleStreamName(correlation)

    await messageStore.write([
      noCorrelation, firstCorrelated, otherCorrelation, secondCorrelated
    ], exampleStreamName(consumedCategory))

    return {
      consumer,
      firstCorrelated,
      handler,
      noCorrelation,
      otherCorrelation,
      secondCorrelated
    }
  }

  it('processes correlated messages', async () => {
    const { consumer, firstCorrelated, handler, secondCorrelated } = await setupMixedCorrelation()

    const runner = consumer.start()
    await handler.waitUntilCalledAtLeast(2)
    await runner.stop()

    expect(handler.calls).toMatchObject([firstCorrelated.data, secondCorrelated.data])
  })

  it('does not process un-correlated messages', async () => {
    const { consumer, noCorrelation, handler, otherCorrelation } = await setupMixedCorrelation()

    const runner = consumer.start()
    await handler.waitUntilCalledAtLeast(2)
    await runner.stop()

    handler.calls.forEach(call => {
      expect(call).not.toMatchObject(noCorrelation.data)
      expect(call).not.toMatchObject(otherCorrelation.data)
    })
  })
})
