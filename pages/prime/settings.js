import { useContext } from 'react';
import { Context } from '/lib/Context';
import Settings from '/components/Settings';

export default function PrimeSettings() {

  const {
    primeSettings, setPrimeSettings,
  } = useContext(Context);

  return (<Settings type="prime" settings={primeSettings} setSettings={setPrimeSettings} />)
}
