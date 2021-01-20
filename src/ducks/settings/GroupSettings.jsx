import React, { Component, useCallback, useState, useRef } from 'react'
import sortBy from 'lodash/sortBy'
import { Query, useClient, Q, useQuery } from 'cozy-client'
import { withRouter } from 'react-router'
import compose from 'lodash/flowRight'

import { translate } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/Button'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { Media, Img } from 'cozy-ui/transpiled/react/Media'
import Switch from 'cozy-ui/transpiled/react/MuiCozyTheme/Switch'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Input from 'cozy-ui/transpiled/react/Input'
import Stack from 'cozy-ui/transpiled/react/Stack'

import { GROUP_DOCTYPE, accountsConn } from 'doctypes'
import BarTheme from 'ducks/bar/BarTheme'
import { getAccountInstitutionLabel } from 'ducks/account/helpers'
import { getGroupLabel, renamedGroup } from 'ducks/groups/helpers'
import { trackPage } from 'ducks/tracking/browser'

import Loading from 'components/Loading'
import BackButton from 'components/BackButton'
import Table from 'components/Table'
import { PageTitle } from 'components/Title'
import Padded from 'components/Padded'
import { logException } from 'lib/sentry'
import { trackEvent } from 'ducks/tracking/browser'
import { useParams, useRouter } from 'components/RouterContext'

import styles from 'ducks/settings/GroupsSettings.styl'

const makeNewGroup = (client, t) => {
  const obj = client.makeNewDocument('io.cozy.bank.groups')
  obj.label = t('Groups.new-group')
  return obj
}

export const AccountLine = props => {
  const { account, group, toggleAccount } = props

  const handleClickSwitch = useCallback(
    ev => toggleAccount(account._id, group, ev.target.checked),
    [toggleAccount, account, group]
  )

  return (
    <tr>
      <td className={styles.GrpStg__accntLabel}>
        {account.shortLabel || account.label}
      </td>
      <td className={styles.GrpStg__accntBank}>
        {getAccountInstitutionLabel(account)}
      </td>
      <td className={styles.GrpStg__accntNumber}>{account.number}</td>
      <td className={styles.GrpStg__accntToggle}>
        {group ? (
          <Switch
            disableRipple
            color="primary"
            id={account._id}
            checked={group.accounts.existsById(account._id)}
            onClick={handleClickSwitch}
          />
        ) : (
          <Switch id={account._id} disabled />
        )}
      </td>
    </tr>
  )
}

const AccountsList = props => {
  const { t } = useI18n()
  const { accounts, group, toggleAccount } = props

  return accounts.length > 0 ? (
    <Table className={styles.GrpStg__table}>
      <thead>
        <tr>
          <th className={styles.GrpStg__accntLabel}>{t('Groups.label')}</th>
          <th className={styles.GrpStg__accntBank}>{t('Groups.bank')}</th>
          <th className={styles.GrpStg__accntNumber}>
            {t('Groups.account-number')}
          </th>
          <th className={styles.GrpStg__accntToggle}>{t('Groups.included')}</th>
        </tr>
      </thead>
      <tbody>
        {accounts &&
          sortBy(accounts, ['institutionLabel', 'label']).map(account => (
            <AccountLine
              account={account}
              group={group}
              toggleAccount={toggleAccount}
              key={account._id}
            />
          ))}
      </tbody>
    </Table>
  ) : (
    <div>
      <Typography variant="body1">{t('Groups.no-account')}</Typography>
    </div>
  )
}

const updateOrCreateGroup = async (client, group, router, successCallback) => {
  const isNew = !group.id
  try {
    const response = await client.save(group)
    if (response && response.data) {
      const doc = response.data
      if (isNew) {
        router.push(`/settings/groups/${doc.id}`)
      }
    }
  } finally {
    successCallback && successCallback()
  }
}

const stackStyle = { clear: 'left' }

const RemoveGroupButton = props => {
  const { t } = useI18n()
  const client = useClient()
  const router = useRouter()
  const { group } = props

  const handleRemove = useCallback(async () => {
    try {
      await client.destroy(group)
      trackEvent({
        name: 'supprimer'
      })
      router.push('/settings/groups')
    } catch (err) {
      logException(err)
      Alerter.error(t('Groups.deletion-error'))
    }
  }, [group, router, client, t])

  return (
    <Button
      className="u-mt-1 u-ml-0"
      theme="danger-outline"
      onClick={handleRemove}
      label={t('Groups.delete')}
    />
  )
}

const RenameGroupForm = props => {
  const [modifying, setModifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const client = useClient()
  const router = useRouter()
  const inputRef = useRef()
  const { t } = useI18n()

  const { group } = props

  const handleRename = useCallback(() => {
    setSaving(true)
    const updatedGroup = renamedGroup(group, inputRef.current.value)
    return updateOrCreateGroup(client, updatedGroup, router, () => {
      setSaving(false)
      setModifying(false)
      trackEvent({
        name: 'renommer'
      })
    })
  }, [client, group, router])

  const handleModifyName = useCallback(() => {
    setModifying(true)
  }, [setModifying])

  return (
    <form className={styles.GrpStg__form} onSubmit={e => e.preventDefault()}>
      <Media>
        <Img>
          {!modifying ? (
            <Typography variant="body1">{getGroupLabel(group, t)}</Typography>
          ) : (
            <Input
              inputRef={inputRef}
              placeholder={t('Groups.name-placeholder')}
              autoFocus
              type="text"
              defaultValue={getGroupLabel(group, t)}
            />
          )}
        </Img>
        <Img>
          {modifying ? (
            <Button
              disabled={saving}
              theme="regular"
              onClick={handleRename}
              label={t('Groups.save')}
              busy={saving}
            />
          ) : (
            <Button
              theme="text"
              onClick={handleModifyName}
              label={t('Groups.rename')}
            />
          )}
        </Img>
      </Media>
    </form>
  )
}

export class DumbGroupSettings extends Component {
  componentDidMount() {
    this.trackPage()
  }

  trackPage() {
    if (this.props.group._id) {
      trackPage('parametres:groupes:detail')
    } else {
      trackPage('parametres:groupes:nouveau-groupe')
    }
  }

  async updateOrCreate(group, cb) {
    const { router, client } = this.props
    await updateOrCreateGroup(client, group, router, cb)
  }

  toggleAccount = async (accountId, group, enabled) => {
    const accounts = group.accounts
    if (enabled) {
      accounts.addById(accountId)
    } else {
      accounts.removeById(accountId)
    }
    await this.updateOrCreate(group)
    trackEvent({
      name: `compte-${enabled ? 'activer' : 'desactiver'}`
    })
  }

  render() {
    const { t, group } = this.props

    // When deleting the group, there's a re-render between the deletion and the redirection. So we need to handle this case
    if (!group) {
      return null
    }

    return (
      <Padded>
        <div className="u-flex u-flex-items-center  u-mb-1">
          <BackButton to="/settings/groups" arrow />
          <PageTitle className="u-flex u-items-center">
            {getGroupLabel(group, t)}
          </PageTitle>
        </div>

        <Stack spacing="s" style={stackStyle}>
          <div>
            <Typography variant="h5">{t('Groups.label')}</Typography>
            <RenameGroupForm group={group} />
          </div>
          <div>
            <Typography variant="h5" gutterBottom>
              {t('Groups.accounts')}
            </Typography>
            <Query query={accountsConn.query} as={accountsConn.as}>
              {({ data: accounts, fetchStatus }) => {
                if (fetchStatus === 'loading') {
                  return <Loading />
                }

                return (
                  <AccountsList
                    accounts={accounts}
                    group={group}
                    toggleAccount={this.toggleAccount}
                  />
                )
              }}
            </Query>
          </div>
          <RemoveGroupButton group={group} />
        </Stack>
      </Padded>
    )
  }
}

export const GroupSettings = compose(
  translate(),
  withRouter
)(DumbGroupSettings)

const ExistingGroupSettings = props => {
  const { groupId } = useParams()
  const { data: group, fetchStatus } = useQuery(
    Q(GROUP_DOCTYPE).getById(groupId),
    { as: `io.cozy.bank.groups__${groupId}`, singleDocData: true }
  )

  if (fetchStatus === 'loading' || fetchStatus === 'pending') {
    return (
      <>
        <BarTheme theme="primary" />
        <Loading />
      </>
    )
  }

  return (
    <>
      <BarTheme theme="primary" />
      <GroupSettings group={group} {...props} />
    </>
  )
}

export default ExistingGroupSettings

/**
 * We create NewGroupSettings else react-router will reuse
 * the existing <GroupSettings /> when a new account is created and we navigate
 * to the new group settings. We could do something in componentDidUpdate
 * to refetch the group but it seems easier to do that to force the usage
 * of a brand new component
 */
export const NewGroupSettings = props => {
  const { t } = useI18n()
  const client = useClient()
  return (
    <>
      <BarTheme theme="primary" />
      <GroupSettings {...props} group={makeNewGroup(client, t)} />
    </>
  )
}
