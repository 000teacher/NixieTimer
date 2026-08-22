/* =========================================================
   DIGITAL TIMER
   NIXIE TIMER
   script.js 完成版
   ========================================================= */


/* =========================================================
   DOM取得
   ========================================================= */

const minuteTens =
    document.getElementById("minute-tens");

const minuteOnes =
    document.getElementById("minute-ones");

const secondTens =
    document.getElementById("second-tens");

const secondOnes =
    document.getElementById("second-ones");

const progressBar =
    document.getElementById("progress-bar");

const startButton =
    document.getElementById("start-button");

const pauseButton =
    document.getElementById("pause-button");

const resetButton =
    document.getElementById("reset-button");

const timeButtons =
    document.querySelectorAll(".time-button");


/* =========================================================
   4桁
   ---------------------------------------------------------
   ① 分の十の位
   ② 分の一の位
   ③ 秒の十の位
   ④ 秒の一の位
   ========================================================= */

const digitElements = [

    minuteTens,     // ①
    minuteOnes,     // ②
    secondTens,     // ③
    secondOnes      // ④

];


/* =========================================================
   タイマー変数
   ========================================================= */

let totalTime = 0;

let remainingTime = 0;

let timerRunning = false;

let animationFrameId = null;

let lastFrameTime = 0;


/* =========================================================
   ランダム表示設定
   ========================================================= */

/*
   ランダム表示を開始してから
   最初の数字が決定し始めるまでの時間。

   0.9秒。
*/

const RANDOM_START_TIME = 900;


/*
   1つの数字が停止してから
   次の数字が停止するまで。

   0.5秒。
*/

const STOP_INTERVAL = 500;


/* =========================================================
   ランダム表示状態
   ========================================================= */

/*
   true
   → その桁は停止済み

   false
   → その桁はランダム表示中
*/

let stoppedDigits = [

    false,  // ①
    false,  // ②
    false,  // ③
    false   // ④

];


/*
   ランダム表示用
   requestAnimationFrame ID
*/

let randomAnimationId = null;


/*
   ランダム表示中かどうか
*/

let randomRunning = false;


/*
   前回のランダム更新時刻

   高リフレッシュレート環境でも
   安定して動作させるために使用する。
*/

let lastRandomFrameTime = 0;


/* =========================================================
   音声
   ========================================================= */

let audioContext = null;


/* =========================================================
   AudioContext取得
   ========================================================= */

function getAudioContext() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    if (
        audioContext.state === "suspended"
    ) {

        audioContext.resume();

    }


    return audioContext;

}


/* =========================================================
   「ピッ」
   ---------------------------------------------------------
   残り3秒
   残り2秒
   残り1秒
   ========================================================= */

function playBeep(
    duration = 0.12
) {

    const ctx =
        getAudioContext();


    const oscillator =
        ctx.createOscillator();

    const gain =
        ctx.createGain();


    oscillator.connect(gain);

    gain.connect(
        ctx.destination
    );


    oscillator.frequency.value =
        700;


    gain.gain.setValueAtTime(
        0.4,
        ctx.currentTime
    );


    oscillator.start();


    oscillator.stop(
        ctx.currentTime +
        duration
    );

}


/* =========================================================
   終了音
   ---------------------------------------------------------
   0秒
   「ピーーー」
   ========================================================= */

function playEndBeep() {

    const ctx =
        getAudioContext();


    const oscillator =
        ctx.createOscillator();

    const gain =
        ctx.createGain();


    oscillator.connect(gain);

    gain.connect(
        ctx.destination
    );


    oscillator.frequency.value =
        700;


    gain.gain.setValueAtTime(
        0.4,
        ctx.currentTime
    );


    oscillator.start();


    oscillator.stop(
        ctx.currentTime +
        1.0
    );

}


/* =========================================================
   4桁を表示
   ========================================================= */

function setDigits(
    minutes,
    seconds
) {

    const minTens =
        Math.floor(
            minutes / 10
        );

    const minOnes =
        minutes % 10;

    const secTens =
        Math.floor(
            seconds / 10
        );

    const secOnes =
        seconds % 10;


    minuteTens.textContent =
        minTens;

    minuteOnes.textContent =
        minOnes;

    secondTens.textContent =
        secTens;

    secondOnes.textContent =
        secOnes;

}


/* =========================================================
   プログレスバー
   ========================================================= */

function updateProgress() {

    if (
        totalTime <= 0
    ) {

        progressBar.style.width =
            "0%";

        return;

    }


    const percentage =
        (
            remainingTime /
            totalTime
        ) * 100;


    /*
       実際の残り時間から
       常に計算する。

       そのため滑らかに減少する。
    */

    progressBar.style.width =
        `${percentage}%`;


    updateColor(
        percentage
    );

}


/* =========================================================
   色変更
   ========================================================= */

function updateColor(
    percentage
) {

    /*
       数字
    */

    digitElements.forEach(
        element => {

            element.classList.remove(
                "warning-color",
                "danger-color"
            );

        }
    );


    /*
       コロン
    */

    document
        .querySelectorAll(".colon-dot")
        .forEach(
            dot => {

                dot.classList.remove(
                    "colon-warning",
                    "colon-danger"
                );

            }
        );


    /*
       プログレスバー
    */

    progressBar.classList.remove(
        "progress-warning",
        "progress-danger"
    );


    /*
       10%以下
       赤
    */

    if (
        percentage <= 10
    ) {

        digitElements.forEach(
            element => {

                element.classList.add(
                    "danger-color"
                );

            }
        );


        document
            .querySelectorAll(".colon-dot")
            .forEach(
                dot => {

                    dot.classList.add(
                        "colon-danger"
                    );

                }
            );


        progressBar.classList.add(
            "progress-danger"
        );


        return;

    }


    /*
       50%以下
       黄色
    */

    if (
        percentage <= 50
    ) {

        digitElements.forEach(
            element => {

                element.classList.add(
                    "warning-color"
                );

            }
        );


        document
            .querySelectorAll(".colon-dot")
            .forEach(
                dot => {

                    dot.classList.add(
                        "colon-warning"
                    );

                }
            );


        progressBar.classList.add(
            "progress-warning"
        );

    }

}


/* =========================================================
   待機
   ========================================================= */

function wait(
    milliseconds
) {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


/* =========================================================
   ランダム数字を更新
   ========================================================= */

/*
   今回の高速化の中心。

   setIntervalではなく
   requestAnimationFrameを使用する。

   ブラウザが画面を描画する直前に
   数字を更新するため、

       数字を変更
          ↓
       画面描画

   が非常に安定する。


   また、停止していない4桁を
   1回の描画タイミングでまとめて更新する。
*/

function updateRandomDigits(
    timestamp
) {

    /*
       ランダム表示が終了していたら
       何もしない
    */

    if (
        !randomRunning
    ) {

        return;

    }


    /*
       4桁すべてを更新。

       停止済みの桁は変更しない。
    */

    for (
        let i = 0;
        i < digitElements.length;
        i++
    ) {

        if (
            stoppedDigits[i]
        ) {

            continue;

        }


        digitElements[i]
            .textContent =
            Math.floor(
                Math.random() * 10
            );

    }


    /*
       次の画面描画で
       再びランダム数字を表示
    */

    randomAnimationId =
        requestAnimationFrame(
            updateRandomDigits
        );

}


/* =========================================================
   超高速ランダム表示開始
   ========================================================= */

function startRandomDisplay() {

    /*
       以前のランダム表示を
       完全に停止
    */

    stopRandomDisplay();


    /*
       ランダム表示開始
    */

    randomRunning = true;


    /*
       ====================================================
       ★重要
       ====================================================

       requestAnimationFrameを待たず、

       「時間ボタンを押した瞬間」

       に4桁すべてをランダム数字へ変更する。

       これにより最初の表示が
       遅れて見える問題を抑える。
    */

    for (
        let i = 0;
        i < digitElements.length;
        i++
    ) {

        digitElements[i]
            .textContent =
            Math.floor(
                Math.random() * 10
            );

    }


    /*
       時刻を記録
    */

    lastRandomFrameTime =
        performance.now();


    /*
       すぐにランダムループ開始
    */

    randomAnimationId =
        requestAnimationFrame(
            updateRandomDigits
        );

}


/* =========================================================
   ランダム表示停止
   ========================================================= */

function stopRandomDisplay() {

    randomRunning = false;


    if (
        randomAnimationId !== null
    ) {

        cancelAnimationFrame(
            randomAnimationId
        );

        randomAnimationId = null;

    }

}


/* =========================================================
   1桁停止
   ========================================================= */

function stopDigit(
    index,
    value
) {

    /*
       ★最重要

       ランダムループより先に
       停止状態をtrueにする。

       これにより次のフレームから
       この桁には一切触れない。
    */

    stoppedDigits[index] =
        true;


    /*
       正しい数字を表示
    */

    digitElements[index]
        .textContent =
        value;

}


/* =========================================================
   時間設定時のランダム演出
   ========================================================= */

async function runNumberAnimation(
    minutes
) {

    /*
       ================================================
       現在のタイマーを停止
       ================================================
    */

    timerRunning = false;


    if (
        animationFrameId !== null
    ) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId = null;

    }


    /*
       ================================================
       最終的に表示する数字
       ================================================
    */


    /*
       ① 分の十の位
    */

    const digit1 =
        Math.floor(
            minutes / 10
        );


    /*
       ② 分の一の位
    */

    const digit2 =
        minutes % 10;


    /*
       ③ 秒の十の位
    */

    const digit3 =
        0;


    /*
       ④ 秒の一の位
    */

    const digit4 =
        0;


    /*
       ================================================
       すべて未停止に戻す
       ================================================
    */

    stoppedDigits = [

        false,  // ①

        false,  // ②

        false,  // ③

        false   // ④

    ];


    /*
       ================================================
       4桁すべて高速ランダム開始
       ================================================
    */

    startRandomDisplay();


    /*
       ================================================
       高速ランダム表示
       ================================================
    */

    await wait(
        RANDOM_START_TIME
    );


    /*
       ================================================
       ② 分の一の位を停止
       ================================================
    */

    stopDigit(
        1,
        digit2
    );


    /*
       ================================================
       0.5秒待つ
       ================================================
    */

    await wait(
        STOP_INTERVAL
    );


    /*
       ================================================
       ④ 秒の一の位を停止
       ================================================
    */

    stopDigit(
        3,
        digit4
    );


    /*
       ================================================
       0.5秒待つ
       ================================================
    */

    await wait(
        STOP_INTERVAL
    );


    /*
       ================================================
       ③ 秒の十の位を停止
       ================================================
    */

    stopDigit(
        2,
        digit3
    );


    /*
       ================================================
       0.5秒待つ
       ================================================
    */

    await wait(
        STOP_INTERVAL
    );


    /*
       ================================================
       ① 分の十の位を停止
       ================================================
    */

    stopDigit(
        0,
        digit1
    );


    /*
       ================================================
       すべて停止
       ================================================
    */

    stopRandomDisplay();


    /*
       ================================================
       最終表示を確実に設定
       ================================================
    */

    setDigits(
        minutes,
        0
    );


    /*
       ================================================
       タイマー設定
       ================================================
    */

    totalTime =
        minutes * 60 * 1000;

    remainingTime =
        totalTime;


    /*
       プログレスバー
    */

    updateProgress();

}


/* =========================================================
   時間ボタン
   ========================================================= */

timeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            async () => {

                /*
                   ユーザー操作なので
                   AudioContextを有効化
                */

                getAudioContext();


                /*
                   選択された時間
                */

                const minutes =
                    Number(
                        button.dataset.minutes
                    );


                /*
                   選択状態を変更
                */

                timeButtons.forEach(
                    b => {

                        b.classList.remove(
                            "selected"
                        );

                    }
                );


                button.classList.add(
                    "selected"
                );


                /*
                   ランダム数字演出
                */

                await runNumberAnimation(
                    minutes
                );

            }
        );

    }
);


/* =========================================================
   START
   ========================================================= */

startButton.addEventListener(
    "click",
    () => {

        /*
           時間が設定されていなければ
           開始しない
        */

        if (
            totalTime <= 0 ||
            remainingTime <= 0
        ) {

            return;

        }


        /*
           音声を有効化
        */

        getAudioContext();


        /*
           すでに動作中なら
           何もしない
        */

        if (
            timerRunning
        ) {

            return;

        }


        /*
           タイマー開始
        */

        timerRunning = true;


        /*
           現在時刻
        */

        lastFrameTime =
            performance.now();


        /*
           タイマーループ開始
        */

        animationFrameId =
            requestAnimationFrame(
                timerLoop
            );

    }
);


/* =========================================================
   タイマーループ
   ========================================================= */

function timerLoop(
    timestamp
) {

    /*
       停止中なら終了
    */

    if (
        !timerRunning
    ) {

        return;

    }


    /*
       前回から経過した時間
    */

    const elapsed =
        timestamp -
        lastFrameTime;


    /*
       現在時刻を保存
    */

    lastFrameTime =
        timestamp;


    /*
       残り時間を減らす
    */

    remainingTime -=
        elapsed;


    /*
       マイナス防止
    */

    if (
        remainingTime < 0
    ) {

        remainingTime = 0;

    }


    /*
       ================================================
       表示する秒数
       ================================================

       ceilを使うことで、

       START
       ↓
       00:59

       のように正しくカウントダウンし、

       00:00
       ↓
       00:01

       のような一瞬の逆方向表示を防ぐ。
    */

    const displaySeconds =
        Math.ceil(
            remainingTime / 1000
        );


    /*
       分
    */

    const minutes =
        Math.floor(
            displaySeconds / 60
        );


    /*
       秒
    */

    const seconds =
        displaySeconds % 60;


    /*
       数字表示
    */

    setDigits(
        minutes,
        seconds
    );


    /*
       プログレスバー
    */

    updateProgress();


    /*
       ================================================
       残り3秒
       ================================================
    */

    if (
        displaySeconds === 3 &&
        remainingTime > 0
    ) {

        playBeep(
            0.12
        );

    }


    /*
       ================================================
       残り2秒
       ================================================
    */

    if (
        displaySeconds === 2 &&
        remainingTime > 0
    ) {

        playBeep(
            0.12
        );

    }


    /*
       ================================================
       残り1秒
       ================================================
    */

    if (
        displaySeconds === 1 &&
        remainingTime > 0
    ) {

        playBeep(
            0.12
        );

    }


    /*
       ================================================
       0秒
       ================================================
    */

    if (
        remainingTime <= 0
    ) {

        /*
           0:00を確実に表示
        */

        remainingTime = 0;


        setDigits(
            0,
            0
        );


        /*
           プログレスバー0%
        */

        progressBar.style.width =
            "0%";


        updateColor(
            0
        );


        /*
           タイマー停止
        */

        timerRunning = false;


        animationFrameId =
            null;


        /*
           終了音
        */

        playEndBeep();


        return;

    }


    /*
       次のフレーム
    */

    animationFrameId =
        requestAnimationFrame(
            timerLoop
        );

}


/* =========================================================
   PAUSE
   ========================================================= */

pauseButton.addEventListener(
    "click",
    () => {

        /*
           動作中でなければ何もしない
        */

        if (
            !timerRunning
        ) {

            return;

        }


        /*
           タイマー停止
        */

        timerRunning = false;


        /*
           アニメーション停止
        */

        if (
            animationFrameId !== null
        ) {

            cancelAnimationFrame(
                animationFrameId
            );

            animationFrameId = null;

        }

    }
);


/* =========================================================
   RESET
   ========================================================= */

resetButton.addEventListener(
    "click",
    () => {

        /*
           タイマー停止
        */

        timerRunning = false;


        /*
           ランダム表示停止
        */

        stopRandomDisplay();


        /*
           タイマーアニメーション停止
        */

        if (
            animationFrameId !== null
        ) {

            cancelAnimationFrame(
                animationFrameId
            );

            animationFrameId = null;

        }


        /*
           時間リセット
        */

        totalTime = 0;

        remainingTime = 0;


        /*
           停止状態リセット
        */

        stoppedDigits = [

            false,
            false,
            false,
            false

        ];


        /*
           数字を0000に戻す
        */

        setDigits(
            0,
            0
        );


        /*
           プログレスバー
        */

        progressBar.style.width =
            "0%";


        /*
           色を初期状態に戻す
        */

        updateColor(
            100
        );


        /*
           時間ボタンの選択解除
        */

        timeButtons.forEach(
            button => {

                button.classList.remove(
                    "selected"
                );

            }
        );

    }
);


/* =========================================================
   初期状態
   ========================================================= */

setDigits(
    0,
    0
);


progressBar.style.width =
    "0%";


updateColor(
    100
);