import Head from 'next/head';
import {useState, useEffect, useContext} from 'react';
import { Context } from '../lib/Context';
import Link from 'next/link';
import axios from "axios";

export default function Home() {

  const {
    toastOptions,
    isLoading, isUpdating,
    runtime, setRuntime, bot,
    bankAssets
  } = useContext(Context);

  return (
    <div className="container">
      <Head>
        <title>CV Helper</title>
        <meta name="description" content="Created by Hyur" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="buttons">
          <Link className="button" href="/banks">Online banking</Link>
          {/* <Link className="button" href="/prime">Prime Meetings</Link> */}
        </div>
      </main>

    </div>
  )
}
