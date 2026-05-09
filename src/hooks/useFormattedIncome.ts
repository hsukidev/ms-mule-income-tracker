import { useFormatPreference } from '../context/FormatPreferenceProvider';
import { formatMeso } from '../utils/meso';

interface UseFormattedIncomeOptions {
  /** When true, force the abbreviated meso format regardless of the global
   * **Format Preference**. Single owner of the override rule (today: the
   * `MuleListRow` narrow-viewport breakpoint). */
  force?: boolean;
}

interface FormattedIncome {
  /** The post-cap meso formatted per the **Format Preference** (or forced
   * abbreviated when `opts.force === true`). */
  abbreviated: string;
  /** Always full-precision (`abbreviated=false`) — used by full-precision
   * tooltips like `MetricTooltip` regardless of the user's preference. */
  full: string;
}

export function useFormattedIncome(
  postCapMeso: number,
  opts?: UseFormattedIncomeOptions,
): FormattedIncome {
  const { abbreviated } = useFormatPreference();
  const force = opts?.force ?? false;
  return {
    abbreviated: formatMeso(postCapMeso, abbreviated || force),
    full: formatMeso(postCapMeso, false),
  };
}
