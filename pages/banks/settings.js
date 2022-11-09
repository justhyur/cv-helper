import { useContext } from 'react';
import { Context } from '/lib/Context';
import Settings from '/components/Settings';

export default function BanksSettings() {

  const {
    bankSettings, setBankSettings,
  } = useContext(Context);

  return (<Settings type="banks" settings={bankSettings} setSettings={setBankSettings} />)
}
