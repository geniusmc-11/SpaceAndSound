import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Counter from '../Counter.vue'

describe('Counter', () => {
  it('incrementa al hacer click', async () => {
    const wrapper = mount(Counter)
    await wrapper.trigger('click')
    expect(wrapper.text()).toContain('Clicks: 1')
  })
})
