import cx from 'classnames';

interface IProps {
  label: string;
  children?: string | JSX.Element | JSX.Element[];
  value?: number | string;
  isTop?: boolean;
  isWarning?: boolean;
}

export default function ExchangeInfoRow(props: IProps) {
  const { label, children, value, isTop, isWarning } = props;

  return (
    <div className={cx('Exchange-info-row', { 'top-line': isTop })}>
      <div className="Exchange-info-label">{label}</div>
      <div className={`align-right ${isWarning ? 'Exchange-info-value-warning' : ''}`}>{children || value}</div>
    </div>
  );
}
