import type { TFunction } from "i18next";
import type { ActionId } from "./defaults";

/** Nome da ação no idioma atual. Ações numeradas ("tab.goTo.3") usam o número como parâmetro. */
export function actionLabel(t: TFunction, action: ActionId): string {
  const numbered = /^(.*)\.(\d+)$/.exec(action);
  return numbered ? t(`actions.${numbered[1]}`, { n: numbered[2] }) : t(`actions.${action}`);
}
