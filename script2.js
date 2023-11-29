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
	butConnect.addEventListener('click', clickConnect);	//connectボタン
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
	//ポートオープンと接続を要求
	port[num] = await navigator.serial.requestPort();
	//ポートがオープンするまで待つ
	await port[num].open({ baudRate: 115200 });
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
