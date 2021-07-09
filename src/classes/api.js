import moment from 'moment'
import axios from 'axios'
import { createScrtClient, useWallet, coinConvert } from '@stakeordie/griptape.js'

const url = 'https://datahubarchive.stakeordie.workers.dev'

export default {

  getDatesArray(startDate, endDate) {

    var now = startDate
    const dates = [];

    while (now.isSameOrBefore(endDate)) {
        const date = now.format('YYYY-MM-DD');
        dates.push({ date });
        now.add(1, 'days');
    }
    return dates;
  },

  async getArchivalBalance(contractAddress, height) {
    const wallet = await useWallet()
    const scrt = await createScrtClient(url, wallet)
    const Vk = await wallet.getSnip20ViewingKey(contractAddress)
    if(height === undefined) {
      height = await this.getHeight()
    }
    const address = await wallet.getAddress()

    const msg = {
      "balance": {
        "address": address,
        "key": Vk
      }
    }
    const res = await scrt.queryContract(contractAddress, msg, { height })
    return res.balance
  },

  async getSefiTransactionHistory() {
    const wallet = await useWallet()
    const scrt = await createScrtClient(url, wallet)  
    const sefiVk = await wallet.getSnip20ViewingKey('secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt');
    const address = await wallet.getAddress()
    // secretcli q compute query secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt  '{"transfer_history":{ "address": "secret1t85jewrnlskhc2p3dzfnfh5puzthd0lxzwp6ly", "key": "api_key_HMKLSbe7UvBhLpurl0jysNhHwRiqeeEMUJxx/0uZJLw=", "page_size":1000}}'
    console.log(scrt)
    const msg = {
      "transfer_history": {
        "address": address,
        "key": sefiVk,
        "page_size":1000
      }
    }

    const res = await scrt.queryContract('secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt', msg);
    console.log(res);
    return res.transfer_history.txs;
  },

  async getSpySefiSignedTxs(spyAddress) {
    const address = await wallet.getAddress()
    const url = 'https://api.stakeordie.com/txs?message.action=execute&message.signer=' + address + '&message.contract_address=' + spyAddress;
    const res = await axios.get(url);
    const txs = res.data.txs;
    const filteredTxs = txs.filter(tx => {
      return parseInt(tx.tx.value.fee.amount[0].amount) >= 75000
    });
    return filteredTxs;
  },

  async getSignedTxs(contractAddress) {
    const address = await wallet.getAddress()
    const url = 'https://api.stakeordie.com/txs?message.action=execute&message.signer=' + address + '&message.contract_address=' + contractAddress;
    const res = await axios.get(url);
    const txs = res.data.txs;
    const filteredTxs = txs.filter(tx => {
      return parseInt(tx.tx.value.fee.amount[0].amount) >= 75000
    });
    return filteredTxs;
  },

  async getIncentivizedToken(contractAddress) {
    const wallet = await useWallet()
    const scrt = await createScrtClient(url, wallet)
    const msg = {
      "incentivized_token": {}
    }

    const res = await scrt.queryContract(contractAddress, msg);
    return res.incentivized_token.token.address;
  },

  async getHeight() {
    const url = 'https://api.stakeordie.com/blocks/latest'
    const res = await axios.get(url);
    const height = res.data.block.last_commit.height;
    return height;
  },

  async getSpyUnclaimedRewards(spyAddress) {
    const wallet = await useWallet()
    const scrt = await createScrtClient(url, wallet)
    const spySefiVk = await wallet.getSnip20ViewingKey(spyAddress);
    const height = await this.getHeight();
    const address = await wallet.getAddress();
    const msg = {
      "rewards": {
        "address": address,
        "key": spySefiVk,
        "height": parseInt(height)
      }
    }
    const res = await scrt.queryContract(spyAddress, msg);
    return res.rewards.rewards;
  },

  async parseSefiTransactionHistory(txs, pub_tx_log, unclaimedRewards, spyAddress) {

    //console.log("og", txs);

    //sort txs oldest to newest

    txs.sort( function(a, b){
        if(a.id > b.id) return 1;
        if(a.id < b.id) return -1;
        return 0;
    }); 

    //console.log("sorted by id", txs);

    //remove txs not realated the the spyAddress

    txs = txs.filter(tx => {
      return tx.from == spyAddress || tx.receiver == spyAddress
    })

    //console.log("filtered", txs);

    //Identify the txs
    
    for(let i=0;i<txs.length;i++) {
      if(i == 0) {
        txs[i].type = "init_dep"; //N
        continue;
      }

      if(typeof txs[i].type === 'string') {
        continue;
      }
 
      if(txs[i].receiver == spyAddress) {
        txs[i].type = "dep"; //N
        txs[i+1].type = "dep_claim"; //N
        continue
      }

      if(txs[i].from == spyAddress) {
        if(txs[i+1].coins.amount == 0) {
          txs[i].type = 'claim'; //Y
          txs[i+1].type = 'claim_claim';
        } else {
          txs[i].type = 'with'; //Y
          txs[i+1].type = 'with_claim'; 
        }
      }

    }
    

   //console.log("typed", txs);

    //GET SEFI LOG
    const incentivizedToken = await this.getIncentivizedToken(spyAddress);
    const sefiTxs = await this.getSignedTxs(incentivizedToken)
    let startDate;
    console.log("initAmount", parseInt(txs[0].coins.amount));
    for(let i=0; i<sefiTxs.length; i++){
      const balancepre = await this.getArchivalBalance(incentivizedToken, parseInt(sefiTxs[i].height) - 1)
      const balance = await this.getArchivalBalance(incentivizedToken, parseInt(sefiTxs[i].height))
      const delta = parseInt(balancepre.amount) - parseInt(balance.amount)
      console.log("delta", delta);
      if(parseInt(txs[0].coins.amount) == delta) {
        startDate = moment(sefiTxs[i].timestamp)
        console.log(startDate);
        break;
      }
    }

    let txs_new = [];
    let dep_claim = 0;
    for(let i=0;i<txs.length;i++) {
      if(txs[i].type == 'dep' || txs[i].type == 'claim_claim' || txs[i].type == 'with' || txs[i].type == 'init_dep') {
        continue
      }
      if(txs[i].type == 'dep_claim') {
        dep_claim = txs[i].coins.amount;
        continue
      }
      if(dep_claim > 0) {
        const x = parseInt(txs[i].coins.amount) + parseInt(dep_claim);
        txs[i].coins.amount = x.toString()
        dep_claim = 0;
      }
      txs_new.push(txs[i]);
    }

    console.log("typed_filtered", txs_new);
    
    let prev_date = startDate;
    console.log(txs_new.length);
    let daily_rewards;
    let mod;
    for(let i=0;i<txs_new.length;i++) {
      const date = moment(pub_tx_log[i].timestamp)
      txs_new[i].timestamp = pub_tx_log[i].timestamp;
      txs_new[i].date_from = prev_date
      txs_new[i].height = pub_tx_log[i].height
      txs_new[i].date_to = date
      prev_date = date;
      const days = txs_new[i].date_to.diff(txs_new[i].date_from, 'days');
      const hours = txs_new[i].date_to.diff(txs_new[i].date_from, 'hours');
      console.log("hours", hours);
      txs_new[i].days = days
      txs_new[i].hours = hours
    }

    for(let i=0;i<txs_new.length;i++) {
      if(txs_new[i].days == 0) {
        daily_rewards = parseInt(txs_new[i].coins.amount);
        mod = 0
      } else {
        daily_rewards = parseInt(txs_new[i].coins.amount) / txs_new[i].days
        mod = parseInt(txs_new[i].coins.amount) % txs_new[i].days
      }
      txs_new[i].daily_rewards = Math.trunc(daily_rewards).toString()
      txs_new[i].mod = mod.toString()
    }

    

    
    let current_date;
    if(unclaimedRewards > 0) {
      current_date = moment();
      const dateDiff = current_date.diff(prev_date, 'days')
      txs_new.push({
        coins: {
          amount: unclaimedRewards,
          denom: "SEFI"
        },  
        date_from: prev_date,
        date_to: current_date,
        days: current_date.diff(prev_date, 'days'),
        daily_rewards: Math.trunc(parseInt(unclaimedRewards) / dateDiff),
        mod: parseInt(unclaimedRewards) % dateDiff
      });
    } else {
      current_date = prev_date;
    }


    console.log("dated&heighted", txs_new);

    const daysArray = this.getDatesArray(startDate, current_date);

    console.log(daysArray)
    
    
    daysArray.forEach(day => {
      const date = moment(day.date, 'YYYY-MM-DD');
      const txDate = txs_new.find(tx => {
        return date.isSameOrBefore(tx.date_to)
      })
      day.rewards = txDate.daily_rewards
      if(txDate.date_to.isSame(date, 'day')) {
        day.claim = txDate.coins.amount
      }
    })

    return daysArray;

  }

}
