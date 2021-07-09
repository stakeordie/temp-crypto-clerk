<template>
  <label for="spyAddress">SPY Address</label>
  <select v-model="spyAddress">
    <option disabled value="">Select a Farm</option>
    <option v-for="(option, index) in spyOptions" :key="index" v-bind:value="option.value">
      {{ option.text }}
    </option>
  </select>
  <!-- <br>
  Add Start Date Manually? <input type="checkbox" v-model="manualDate" />
  <br>
  <input v-if="manualDate" type="date" v-model="startDateString"/> -->
  <br>
  <button @click="doit">Get Rewards</button>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Claim</th>
        <th>Est. Daily Rewards</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(day, index) in days" :key="index">
        <td>{{day.date}}</td>
        <td>{{coinConvert(day.claim,6,"human",4)}}</td>
        <td>{{coinConvert(day.rewards,6,"human",4)}}</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import api from './classes/api'
import { coinConvert } from '@stakeordie/griptape.js'

export default {
  async mounted() {
    await api.init();
    // const txs = await api.getSefiTransactionHistory();
    // const pub_tx_log = await api.getSpySefiSignedTxs();
    // const unclaimedRewards = await api.getSpyUnclaimedRewards();
    // this.days = await api.parseSefiTransactionHistory(txs, pub_tx_log, unclaimedRewards, '2021-03-30', "secret1y9z3ck449a46r4ku7klkhdxnlq07zh4shc7cuy")
    // console.log(this.days);
    /*const txs = await api.getSignedTxs('secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt')
    console.log(txs)
    for(let i=0; i<txs.length; i++){
      const balancepre = await api.getArchivalBalance('secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt', parseInt(txs[i].height) - 1)
      console.log(balancepre);
      const balance = await api.getArchivalBalance('secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt', parseInt(txs[i].height))
      console.log(balance);
      txs[i].amountDelta = parseInt(balance.amount) - parseInt(balancepre.amount)
      
    }
    console.log(txs)*/
  },
  data(){
    return {
      days: [],
      spyAddress: "",
      // startDateString: "",
      // manualDate: false,
      spyOptions: [
        { text: 'SEFI', value: 'secret1y9z3ck449a46r4ku7klkhdxnlq07zh4shc7cuy' },
        { text: 'sSCRT-SEFI', value: 'secret1097s3zmexc4mk9s2rdv3gs6r76x9dn9rmv86c7' },
        { text: 'sSCRT-sETH', value: 'secret146dg4c7jt5y37nw94swp6sahleshefxhrerpqm' },
        { text: 'sSCRT-sWBTC', value: 'secret1a3qvtsxd3fu5spkrscp5wwz3gtjmf50fgruezy' },
        { text: 'sSCRT-sUSDT', value: 'secret1zysw570u5edsfdp44q80tm5zhdllawgh603ezy' },
        { text: 'sSCRT-sLINK', value: 'secret1mlv3av6nlqt3fmzmtw0pnehsff2dxrzxq98225' },
        { text: 'sSCRT-sRSR', value: 'secret1rxu6rksvyaxksnhqszv06d3n92y0prgr2ghj5m' },
        { text: 'sSCRT-sRUNE', value: 'secret16wup0xc9m5ndgvna3p523xntk7favp353xa79v' },
        { text: 'sSCRT-sUNI', value: 'secret13gdhmsf5j9jjva6d924hhdjrngf8092tv5frp8' },
        { text: 'sSCRT-sOCEAN', value: 'secret1zpz7x64lm625k0rxgk6z0drffz5hwwsnnwaxkf' },
        { text: 'sSCRT-sYFI', value: 'secret1d5qkesgrhhpcvkaephrs5ws7nvankrkgf32un5' },
        { text: 'sSCRT-sDAI', value: 'secret1fc3w26lv0t2q8j2u0rrc7cf5mycde9sqg8jjf6' },
        { text: 'sSCRT-sMANA', value: 'secret1358gj5s2ys859tuue6v43w98jzavfnh8d8gz8y' },
        { text: 'sETH-sWBTC', value: 'secret1mznq6qwlj3ryzfpetfgydffef7w40tmlkhufcl' },
      ]
    }
  },
  methods: {
    coinConvert,
    async doit() {
      const txs = await api.getSefiTransactionHistory(this.spyAddress);
      const pub_tx_log = await api.getSpySefiSignedTxs(this.spyAddress);
      console.log(pub_tx_log);
      const unclaimedRewards = await api.getSpyUnclaimedRewards(this.spyAddress);
      // if(this.manualDate) {
      //   this.days = await api.parseSefiTransactionHistory(txs, pub_tx_log, unclaimedRewards, this.spyAddress, this.startDateString)
      // } else {
      //    this.days = await api.parseSefiTransactionHistory(txs, pub_tx_log, unclaimedRewards, this.spyAddress)
      // }
      this.days = await api.parseSefiTransactionHistory(txs, pub_tx_log, unclaimedRewards, this.spyAddress)
      console.log(this.days);
    }
  }
}

</script>

<style>
table {
    border: solid 1px #DDEEEE;
    border-collapse: collapse;
    border-spacing: 0;
    font: normal 13px Arial, sans-serif;
}
table thead th {
    background-color: #DDEFEF;
    border: solid 1px #DDEEEE;
    color: #336B6B;
    padding: 10px;
    text-align: left;
    text-shadow: 1px 1px 1px #fff;
}
table tbody td {
    border: solid 1px #DDEEEE;
    color: #333;
    padding: 10px;
    text-shadow: 1px 1px 1px #fff;
}
</style>
