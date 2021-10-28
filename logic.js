const serverUrl = "YOUR SERVER URL HERE";
const appId = "YOUR APP ID HERE";
Moralis.start({ serverUrl, appId });
var web3;
checkWeb3();


function displayMessage(messageType, message){

    messages = {
        "00":`<div class= "alert alert-success"> ${message} </div>`,
        "01":`<div class= "alert alert-danger"> ${message} </div>`
    }
    document.getElementById("resultSpace").innerHTML = messages[messageType];
}

async function checkWeb3(){
    const ethereum = window.ethereum;
    if(!ethereum || !ethereum.on) {
        displayMessage("01", "This App Requires MetaMask, Please Install MetaMask");
    }
    else{
        //displayMessage("00", "Metamask is Installed");
        setWeb3Environment()
    }
}

function setWeb3Environment(){
    web3 = new Web3(window.ethereum);
    getNetwork();
    monitorNetwork();
}

async function getNetwork(){
    chainID = await web3.eth.getChainId()
    displayMessage("00","Active network is "+ getNetworkName(chainID));
}

function getNetworkName(chainID){
    networks = {
        1:"Ethereum Mainnet",
        43114:"Avalanche Mainnet",
        56:"Binance Smart Chain",
        137:"Polygon"
    }
    return networks[chainID];
}



function monitorNetwork(){
    Moralis.onChainChanged(function(){
        getNetwork()
    })
}



async function displayTokens(chn, chnSymbol, nativeAdd, nativeDecimals,dbRef, dbRefNative, htmlRef){
    const query = new Moralis.Query(dbRef)
    query.equalTo("address", Moralis.User.current().get("ethAddress"))
    query.notEqualTo("balance", "0");
    const results = await query.find();

    const queryNative = new Moralis.Query(dbRefNative)
    queryNative.equalTo("address", Moralis.User.current().get("ethAddress"))
    const resultsNative = await queryNative.first();
    let nativePrice = {};
    let prices = [];

    if(chn != "avalanche"){
    nativePrice = await Moralis.Web3API.token.getTokenPrice({chain:chn, address: nativeAdd})
    prices = await Promise.all(results.map(async (e) =>
        await Moralis.Web3API.token.getTokenPrice({chain:chn, address: e.get("token_address")})
    ));}else{
    nativePrice = {usdPrice: 1};//set avax price
    prices = [{usdPrice: 1}]; //set avalanche chain token prices
    }
    

    let nativeBal = resultsNative.get("balance") / ("1e" + nativeDecimals);
    let nativePri = nativePrice.usdPrice;
    let table = '<table class="table">';
    table += `<thead><tr><th>Token</th><th>Amount</th><th>USD Value</th></tr></thead><tbody>`;
    table = table + `<tr>`;
    //Need to add token png images to directory for this to work
    table = table + `<td><img src="${chnSymbol}.png" class="tokens"/> ${chnSymbol} </td>`;
    table = table + `<td>${Math.round(nativeBal*100)/100}</td>`;
    table = table + `<td>$ ${Math.round(nativePri*nativeBal*100)/100}</td>`;
    table += `</tr>`;
    results.forEach((e,i) => {
        let bal = e.get("balance") / ("1e" + e.get("decimals"));
        let pri = prices[i].usdPrice
        table = table + `<tr>`;
        table = table + `<td><img src="${e.get("symbol")}.png" class="tokens"/> ${e.get("symbol")} </td>`;
        table = table + `<td>${Math.round(bal*100)/100}</td>`;
        table = table + `<td>$ ${Math.round(pri*bal*100)/100}</td>`;
        table += `</tr>`;
    });
    table += "</tbody></table>";
    document.getElementById(htmlRef).innerHTML = table;
}



async function displayNFTS(chn, dbRef){
    const query = new Moralis.Query(dbRef)
    query.equalTo("owner_of", Moralis.User.current().get("ethAddress"))
    const results = await query.find();

    let images = await Promise.all(results.map(async (e) => 
        await Moralis.Web3API.token.getTokenIdMetadata({ address: e.get("token_address"), token_id: e.get("token_id"), chain: chn })
    ));

    if(chn == "bsc")
        images.forEach((e,i) =>{
            document.getElementById(i+chn).src = JSON.parse(e.metadata).nft.image;
    });else{
        images.forEach((e,i) =>{
            document.getElementById(i+chn).src = JSON.parse(e.metadata).image;
        });
    }
    
}
