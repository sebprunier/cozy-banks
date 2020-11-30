import React, { useCallback } from 'react'
import cx from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Card from 'cozy-ui/transpiled/react/Card'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import BarTheme from 'ducks/bar/BarTheme'
import AccountSwitch from 'ducks/account/AccountSwitch'
import Padded from 'components/Padded'
import Header from 'components/Header'
import BackButton from 'components/BackButton'
import Loading from 'components/Loading'
import { useRouter } from 'components/RouterContext'

import { TransactionList } from 'ducks/transactions/Transactions'
import LegalMention from 'ducks/legal/LegalMention'
import useEstimatedBudget from './useEstimatedBudget'
import { getCurrencySymbol } from 'utils/currencySymbol'

import styles from './styles.styl'

const HeaderCard = withStyles({
  card: {
    backgroundColor: 'var(--headerInvertedBackgroundColorLight)',
    border: 0
  }
})(({ classes, children }) => {
  return <Card className={classes.card}>{children}</Card>
})

const HeaderInfoCard = () => {
  const { t } = useI18n()
  const { estimatedBalance, currency, transactions } = useEstimatedBudget()

  if (estimatedBalance === null) {
    return null
  }

  return (
    <HeaderCard>
      <Media>
        <Bd>
          <Typography variant="h6" color="primary">
            {t('EstimatedBudget.30-day-balance')}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {t('EstimatedBudget.numberEstimatedTransactions', {
              smart_count: transactions.length
            })}
          </Typography>
        </Bd>
        <Img>
          <Figure
            className="u-ml-2"
            total={estimatedBalance}
            symbol={getCurrencySymbol(currency)}
          />
        </Img>
      </Media>
    </HeaderCard>
  )
}

const PlannedTransactionsPage = () => {
  const budget = useEstimatedBudget()
  const router = useRouter()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const handleBack = useCallback(() => {
    router.push('/balances/details')
  }, [router])
  return (
    <>
      <Header theme="inverted" fixed className={styles.Header}>
        <BarTheme theme="primary" />
        <Padded>
          {isMobile ? (
            <>
              <BackButton theme="primary" onClick={handleBack} />
              <div className={cx('u-ta-center', styles['Title--mobile'])}>
                <div>
                  <Typography color="primary" variant="h5">
                    {t('EstimatedBudget.page-title')}
                  </Typography>
                </div>
                <AccountSwitch size="small" insideBar={false} />
              </div>
              <HeaderInfoCard />
            </>
          ) : (
            <Media>
              <Img>
                <BackButton arrow onClick={handleBack} theme="primary" />
              </Img>
              <Bd className="u-stack-xs">
                <AccountSwitch size="normal" />
                <div>
                  <Typography color="primary" variant="h3">
                    {t('EstimatedBudget.page-title')}
                  </Typography>
                </div>
              </Bd>
              <Img>
                <HeaderInfoCard />
              </Img>
            </Media>
          )}
          <LegalMention className="u-mt-1" />
        </Padded>
      </Header>
      <div
        className={cx(
          'js-scrolling-element',
          isMobile ? styles['List--mobile'] : null
        )}
      >
        {budget.isLoading ? (
          <Padded>
            <Loading />
          </Padded>
        ) : (
          <>
            {budget.transactions && budget.transactions.length > 0 ? (
              <TransactionList
                transactions={budget.transactions}
                showTriggerErrors={false}
              />
            ) : null}
            {budget.transactions && budget.transactions.length === 0 ? (
              <Padded>{t('EstimatedBudget.no-planned-transactions')}</Padded>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}

export default PlannedTransactionsPage
