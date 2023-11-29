// 参考サイト:https://developer.chrome.com/ja/articles/serial/
'use strict';

let port = [];
let reader = [];
let inputDone = [];
let inputStream = [];
let num = 0;

const log = document.getElementById('log');
//htmlが読み込まれた時点で発火するイベント
document.addEventListener('DOMContentLoaded', () => {
	prompt_2_connect_serialPorts();
	// butConnect.addEventListener('click', clickConnect);	//connectボタン
	//デバイスがwebSerialをサポートしていたら表示しない
	const notSupported = document.getElementById('notSupported');
	notSupported.classList.toggle('hidden', 'serial' in navigator);
	//タイムスタンプボタンを押した
	btnTime.addEventListener('click',function()	{
		var tim = new Date();
		log.innerHTML += "<br/>\n" + tim;
	})
	//テキスト入力してenterを押したら値を表示
	text.addEventListener('keyup',function(e)	{
		if(e.keyCode == 13)	{
			log.innerHTML += "<br/>\n" + text.value;
			text.value = "";
		}
	})
	//データクリアボタン
	clear.addEventListener('click',function()	{
		log.textContent = "";
	})
});

/**
 * シリアルポートに接続
 */
 async function connect() {
	try	{
		//ポートオープンと接続を要求
		port[num] = await navigator.serial.requestPort();
	} catch(error)	{
		alert("ポートを選択してください");
		return false;
	}
	//ポートがオープンするまで待つ
	try	{
		await port[num].open({ baudRate: 115200 });
	} catch(error)	{
		alert("このポートはすでに接続済み");
		num = 1;
		return false;
	}
	//データストリームを読み出すところ
	//取り込んだデータをutf-8に変換してくれる
	let decoder = new TextDecoderStream("shift-jis");
	inputDone[num] = port[num].readable.pipeTo(decoder.writable);
	inputStream[num] = decoder.readable;

	reader[num] = inputStream[num].getReader();
	if(!num)
		readLoop();
	else
		readLoop2();
	return true;
}

/**
 * @name disconnect
 * Web Serial connectionを閉じる
 */
 async function disconnect() {
	//readerが存在したら終了する
	if (reader) {
		await reader.cancel();
		await inputDone.catch(() => {});
		reader = null;
		inputDone = null;
	}
	await port.close();
	port = null;
}

/**
 * @name clickConnect
 * connect/disconnectボタンをクリック
 */
async function clickConnect() {
	if(num > 1)	return;
	//ポートが存在したらdisconnect
	if (port[num]) {
		await disconnect(num);
		toggleUIConnected(!num);
		return;
	}
	//接続する
	await connect();
	var info = port[num].getInfo();
	log.innerHTML += "<br/>[接続]:usbProductId=" + info.usbProductId 
		+ " usbVendorId=" + info.usbVendorId + "</br>\n";
	// toggleUIConnected(true);
	num++;
}

/**
 * データを読み込み表示する
 */
async function readLoop() {
	var timerID;
	//ループで読み込むのを待つ
	while (true) {
	const { value, done } = await reader[0].read();
		if (value) {							//値があれば表示
			log.innerHTML += value;
			if(!timerID)	{
				clearTimeout(timerID); //指定時間何も受信しなければ改行
				timerID = setTimeout(function()	{
					log.innerHTML += "<br/>\n";
					timerID = undefined;
				},100);
			}
		}
		if (done) {
			console.log('[readLoop] DONE', done);
			reader[0].releaseLock();
			break;
		}
	}
}
async function readLoop2() {
	var timerID;
	//ループで読み込むのを待つ
	while (true) {
	const { value, done } = await reader[1].read();
		if (value) {							//値があれば表示
			log.innerHTML += value;
			if(!timerID)	{
				clearTimeout(timerID); //指定時間何も受信しなければ改行
				timerID = setTimeout(function()	{
					log.innerHTML += "<br/>\n";
					timerID = undefined;
				},100);
			}
		}
		if (done) {
			console.log('[readLoop1] DONE', done);
			reader[1].releaseLock();
			break;
		}
	}
}
/**
 * Connectボタンをトグルで切り替え
 * @param {*} connected 
 */
function toggleUIConnected(connected) {
	let lbl = 'Connect';
	if (connected) {
		lbl = 'Disconnect';
	}
	butConnect.textContent = lbl;
}
//-----------------------------------
//モーダルウィンドウを開きシリアルポート２つを接続するように促す
const prompt_2_connect_serialPorts = _ =>	{
	const modal = document.createElement("dialog");
	let div = document.createElement("div");
	const mes = ["接続ボタンをクリックしシリアルポートに接続してください"
	,"接続_2ボタンをクリックしシリアルポートに接続してください"];
	div.textContent = "接続ボタンをクリックし、シリアルポートを選択し接続してください";
	div.className = "modal_message";
	modal.append(div);

	div = document.createElement("div");
	const btn = document.createElement("button");
	btn.textContent = "QRコードリーダへの接続";
	btn.className = "btn_connect";
	div.append(btn);
	modal.append(div);	//接続ログ表示エリア
	div = document.createElement("div");
	div.className = "connection_log";
	modal.append(div);
	document.querySelector("body").append(modal);
	modal.showModal();	//モーダルウィンドウを開く
	//接続ボタンをクリック
	document.querySelector(".btn_connect").onclick = async e =>	{
		div = document.createElement("div");
		if(!await connect())
			return;
		const info = port[num].getInfo();
		document.querySelector(".connection_log").innerHTML += 
			(++num) + "台目のQRコードリーダに接続しました。"
			+ "<br/>2台目のQRコードリーダに接続してください";
		if(num == 2)	{
			document.querySelectorAll("dialog div").forEach(v => v.remove());
			const div = document.createElement("div");
			div.textContent = "2台のQRコードリーダに接続しました";
			const modal = document.querySelector("dialog");
			modal.append(div);
			setTimeout(_ =>	{
				modal.close();	//2台目が接続したら閉じる
			},3 * 1000);
		}
	}
}