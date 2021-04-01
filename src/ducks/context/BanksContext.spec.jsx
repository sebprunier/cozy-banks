import React from 'react'

import JobsProvider from '../context/JobsContext'
import BanksProvider, { BanksContext } from '../context/BanksContext'
import { render } from '@testing-library/react'
import CozyClient from 'cozy-client'
import CozyRealtime from 'cozy-realtime'
import { KONNECTOR_DOCTYPE } from '../../doctypes'

jest.mock('cozy-realtime')

export const createKonnectorMsg = (state, konnector, account) => ({
  worker: 'konnector',
  state,
  message: {
    konnector,
    account
  }
})

const RUNNING = 'running'
const KONNECTORS = [
  { konnector: 'caissedepargne1', account: '1234' },
  { konnector: 'boursorama83', account: '5678' }
]

describe('Jobs Context', () => {
  const setup = ({ withKonnectors }) => {
    const client = new CozyClient({})
    client.query = jest.fn().mockImplementation(options => {
      const { doctype } = options
      if (doctype === KONNECTOR_DOCTYPE) {
        return {
          data: KONNECTORS.map(k => ({
            account: k.account,
            slug: k.konnector
          }))
        }
      }
    })
    CozyRealtime.mockImplementation(() => {
      return {
        subscribe: (eventName, doctype, handleRealtime) => {
          // There are 3 subscribers (created, updated, deleted)
          // To simulate handle realtime we check if there are
          // at least the first event and we call handleRealtime callbacks
          if (eventName === 'created') {
            if (withKonnectors) {
              handleRealtime(
                createKonnectorMsg(
                  RUNNING,
                  KONNECTORS[0].konnector,
                  KONNECTORS[0].account
                )
              )
              handleRealtime(
                createKonnectorMsg(
                  RUNNING,
                  KONNECTORS[1].konnector,
                  KONNECTORS[1].account
                )
              )
            }
          }
        },
        unsubscribe: () => {}
      }
    })

    const children = (
      <BanksContext.Consumer>
        {({ jobsInProgress }) => {
          return jobsInProgress.map(job => (
            <div key={job.account}>
              <span>{job.konnector}</span>
              <span>{job.account}</span>
            </div>
          ))
        }}
      </BanksContext.Consumer>
    )

    const root = render(
      <JobsProvider client={client} options={{}}>
        <BanksProvider client={client}>{children}</BanksProvider>
      </JobsProvider>
    )

    return root
  }
  it('should display job in progress', async () => {
    const root = setup({ withKonnectors: true })
    expect(await root.findByText('caissedepargne1')).toBeTruthy()
    expect(await root.findByText('1234')).toBeTruthy()
    expect(await root.findByText('boursorama83')).toBeTruthy()
    expect(await root.findByText('5678')).toBeTruthy()
  })

  it('should not display job in progress', () => {
    const root = setup({ withKonnectors: false })
    expect(root.queryByText('caissedepargne1')).toBeNull()
    expect(root.queryByText('1234')).toBeNull()
    expect(root.queryByText('boursorama83')).toBeNull()
    expect(root.queryByText('5678')).toBeNull()
  })
})
