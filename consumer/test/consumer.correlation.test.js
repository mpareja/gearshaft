const { exampleCategory, exampleStreamName, exampleWriteMessageData } = require('../../message-store')
const { HandledMessageClass, setupConsumerWithHandler } = require('./setup-consumer-with-handler')

describe('all messages have matching correlation stream name', () => {
  it('processes all messages', async () => {
    const correlation = exampleCategory()

    const { consumer, handler, messageStore, category: consumedCategory } =
      setupConsumerWithHandler({ correlation })

    const first = exampleWriteMessageData({ type: HandledMessageClass.name })
    first.metadata.correlationStreamName = exampleStreamName(correlation)

    const second = exampleWriteMessageData({ type: HandledMessageClass.name })
    second.metadata.correlationStreamName = exampleStreamName(correlation)

    await messageStore.write([first, second], exampleStreamName(consumedCategory))

    const runner = consumer.start()
    await handler.waitUntilCalledAtLeast(2)
    await runner.stop()

    expect(handler.calls).toMatchObject([first.data, second.data])
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
