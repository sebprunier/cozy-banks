import React, { PureComponent, Fragment } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { translate, withBreakpoints } from 'cozy-ui/transpiled/react'
import Toggle from 'cozy-ui/transpiled/react/Toggle'
import RawBreadcrumb from 'cozy-ui/transpiled/react/Breadcrumbs'
import { AccountSwitch } from 'ducks/account'
import BackButton from 'components/BackButton'
import Header from 'components/Header'
import { Padded } from 'components/Spacing'
import { ConnectedSelectDates as SelectDates } from 'components/SelectDates'
import CategoriesChart from 'ducks/categories/CategoriesChart'
import {
  getTransactionsTotal,
  getGlobalCurrency
} from 'ducks/categories/helpers'
import { flowRight as compose } from 'lodash'
import styles from 'ducks/categories/CategoriesHeader.styl'
import AddAccountButton from 'ducks/categories/AddAccountButton'
import AnalysisTabs from 'ducks/analysis/AnalysisTabs'
import useTheme, { themed } from 'components/useTheme'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import Table from 'components/Table'
import catStyles from 'ducks/categories/styles.styl'

const Breadcrumb = themed(RawBreadcrumb)

const stAmount = catStyles['bnk-table-amount']
const stCategory = catStyles['bnk-table-category-category']
const stPercentage = catStyles['bnk-table-percentage']
const stTotal = catStyles['bnk-table-total']
const stTableCategory = catStyles['bnk-table-category']

const IncomeToggle = ({ withIncome, onToggle }) => {
  const theme = useTheme()
  const { t } = useI18n()
  return (
    <div className={cx(styles.CategoriesHeader__Toggle, styles[theme])}>
      <Toggle id="withIncome" checked={withIncome} onToggle={onToggle} />
      <label htmlFor="withIncome">{t('Categories.filter.includeIncome')}</label>
    </div>
  )
}

const CategoryAccountSwitch = ({ selectedCategory, breadcrumbItems }) => {
  const [previousItem] = breadcrumbItems.slice(-2, 1)
  return (
    <Fragment>
      <AccountSwitch small={selectedCategory !== undefined} />
      {selectedCategory && (
        <BackButton
          onClick={
            previousItem && previousItem.onClick
              ? previousItem.onClick
              : undefined
          }
          theme="primary"
        />
      )}
    </Fragment>
  )
}

const CategoriesTableHead = props => {
  const { selectedCategory } = props
  const { isDesktop, isTablet } = useBreakpoints()
  const { t } = useI18n()
  return (
    <thead>
      <tr>
        <td className={stCategory}>
          {selectedCategory
            ? t('Categories.headers.subcategories')
            : t('Categories.headers.categories')}
        </td>
        {(isDesktop || isTablet) && (
          <td className={catStyles['bnk-table-operation']}>
            {t('Categories.headers.transactions.plural')}
          </td>
        )}
        {isDesktop && (
          <td className={stAmount}>{t('Categories.headers.credit')}</td>
        )}
        {isDesktop && (
          <td className={stAmount}>{t('Categories.headers.debit')}</td>
        )}
        <td className={stTotal}>{t('Categories.headers.total')}</td>
        <td className={stPercentage}>%</td>
      </tr>
    </thead>
  )
}

class CategoriesHeader extends PureComponent {
  renderAccountSwitch = () => {
    const { selectedCategory, breadcrumbItems } = this.props
    return (
      <CategoryAccountSwitch
        selectedCategory={selectedCategory}
        breadcrumbItems={breadcrumbItems}
      />
    )
  }

  renderIncomeToggle = () => {
    const {
      selectedCategory,
      withIncome,
      onWithIncomeToggle,
      categories
    } = this.props
    const hasData =
      categories.length > 0 && categories[0].transactionsNumber > 0
    const showIncomeToggle = hasData && selectedCategory === undefined

    if (!showIncomeToggle) {
      return null
    }

    return (
      <IncomeToggle withIncome={withIncome} onToggle={onWithIncomeToggle} />
    )
  }

  renderChart = () => {
    const {
      selectedCategory,
      chartSize = 182,
      categories,
      t,
      hasAccount,
      isFetching
    } = this.props
    const globalCurrency = getGlobalCurrency(categories)
    const transactionsTotal = getTransactionsTotal(categories)

    if (isFetching) {
      return null
    }
    const className = hasAccount
      ? undefined
      : { className: styles.NoAccount_chart }

    return (
      <CategoriesChart
        width={chartSize}
        height={chartSize}
        categories={
          selectedCategory ? selectedCategory.subcategories : categories
        }
        selectedCategory={selectedCategory}
        total={selectedCategory ? selectedCategory.amount : transactionsTotal}
        currency={globalCurrency}
        label={t('Categories.title.total')}
        hasAccount={hasAccount}
        {...className}
      />
    )
  }

  render() {
    const {
      breadcrumbItems,
      hasAccount,
      breakpoints: { isMobile },
      t,
      selectedCategory
    } = this.props

    const accountSwitch = this.renderAccountSwitch()
    const incomeToggle = this.renderIncomeToggle()
    const chart = this.renderChart()

    if (isMobile) {
      return (
        <Fragment>
          <Header fixed theme="primary">
            <AnalysisTabs />
            <SelectDates showFullYear />
            {accountSwitch}
          </Header>
          {hasAccount ? (
            <Header theme={isMobile ? 'default' : 'primary'}>
              <Padded>
                {incomeToggle}
                {chart}
              </Padded>
            </Header>
          ) : (
            <Header theme="default" className={cx(styles.NoAccount_container)}>
              <Padded className={styles.NoAccount_box}>
                {chart}
                <AddAccountButton absolute label={t('Accounts.add_bank')} />
              </Padded>
            </Header>
          )}
        </Fragment>
      )
    }

    return (
      <Header theme="primary" fixed>
        <Padded
          className={cx(styles.CategoriesHeader, {
            [styles.NoAccount]: !hasAccount
          })}
        >
          {hasAccount ? (
            <>
              <div>
                <Padded className="u-ph-0 u-pt-0 u-pb-half">
                  {accountSwitch}
                </Padded>
                <Padded className="u-pv-1 u-ph-0">
                  <SelectDates showFullYear />
                </Padded>
                {breadcrumbItems.length > 1 && (
                  <Breadcrumb className="u-mt-1" items={breadcrumbItems} />
                )}
                {incomeToggle}
              </div>
              {chart}
            </>
          ) : (
            <AddAccountButton label={t('Accounts.add_bank')} />
          )}
        </Padded>
        {hasAccount ? (
          <Table className={stTableCategory}>
            <CategoriesTableHead selectedCategory={selectedCategory} />
          </Table>
        ) : null}
      </Header>
    )
  }
}

CategoriesHeader.propTypes = {
  breadcrumbItems: PropTypes.array.isRequired,
  selectedCategory: PropTypes.object,
  withIncome: PropTypes.bool.isRequired,
  onWithIncomeToggle: PropTypes.func.isRequired,
  chartSize: PropTypes.number,
  hasAccount: PropTypes.bool.isRequired,
  categories: PropTypes.array.isRequired,
  t: PropTypes.func.isRequired,
  breakpoints: PropTypes.object.isRequired
}

export default compose(
  translate(),
  withBreakpoints()
)(CategoriesHeader)
