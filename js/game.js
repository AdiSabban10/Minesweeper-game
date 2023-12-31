'use strict'

const MINE = '💣'
const FLAG = '🚩'
const EMPTY = ' '


const gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gLevel = {
    SIZE: 4,
    MINES: 2
}

var gBoard
var gTimer

// document.addEventListener('contextmenu', event => {
//     event.preventDefault();
// })

function onInit() {
    
    resetGame()
    resetTime()

    gBoard = buildBoard()
    putMinesOnBoard(gBoard)
    UpdatBoardMinesNegsCount(gBoard)
    renderBoard(gBoard)

    hideGameOver()

}

function resetGame() {
    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
}

function resetTime() {
    clearInterval(gGame.secsPassed)
    
    var elTimer = document.querySelector('.time')
    elTimer.innerText = gGame.secsPassed
}

function onLevelClicked(elCell) {
    if (elCell.innerHTML === 'Beginner') {
        gLevel.SIZE = 4
        gLevel.MINES = 2
    } else if (elCell.innerHTML === 'Medium') {
        gLevel.SIZE = 8
        gLevel.MINES = 14
    } else if (elCell.innerHTML === 'Expert') {
        gLevel.SIZE = 12
        gLevel.MINES = 32
    }
    // console.log('gLevel:', gLevel)

    onInit()
    // gBoard = buildBoard()
    // putMinesOnBoard(gBoard)
    // UpdatBoardMinesNegsCount(gBoard)
    // renderBoard(gBoard)
}

function buildBoard() {
    const board = createMat(gLevel.SIZE, gLevel.SIZE)

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }

    // console.log('board:', board)
    return board
}

function renderBoard(board) {

    var strHTML = '<table><tbody>'
    for (var i = 0; i < board.length; i++) {

        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {

            const className = `cell cell-${i}-${j}`

            strHTML += `<td onclick="onCellClicked(this, ${i}, ${j})" 
            oncontextmenu="onCellMarked(this, ${i}, ${j})" class="${className}"></td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'

    const elContainer = document.querySelector('.board-container')
    elContainer.innerHTML = strHTML
}

function putMinesOnBoard(board) {
    // for (var i = 0; i < gLevel.MINES; i++) {
    //     const pos = getEmptyPos()
    //     // if(!pos) return
    //     // console.log('pos:', pos)
    //     board[pos.i][pos.j].isMine = true
    // }

    board[1][2].isMine = true
    board[2][1].isMine = true

}

function getEmptyPos() {
    var emptyPositions = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isMine) emptyPositions.push({ i, j })
        }
    }
    const idx = getRandomInt(0, emptyPositions.length)
    return emptyPositions[idx]
}

function setMinesNegsCount(rowIdx, colIdx) {
    var minesCount = 0

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === rowIdx && j === colIdx) continue
            if (gBoard[i][j].isMine) minesCount++
        }
    }
    return minesCount
}

function UpdatBoardMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var mines = setMinesNegsCount(i, j)
            board[i][j].minesAroundCount = mines
        }
    }
}


function renderCell(elCell, i, j, value) {
    var currCell = gBoard[i][j]

    if (currCell.isShown) {
        if (currCell.isMine) value = MINE
        else if (currCell.minesAroundCount) value = currCell.minesAroundCount
        else value = EMPTY
    }

    if (currCell.isMarked && gGame.isOn) value = FLAG

    elCell.innerHTML = value
}

function onCellClicked(elCell, i, j) {
    if (gGame.secsPassed === 0) startTimer()
    if (gBoard[i][j].isMarked) return
    if (gBoard[i][j].isMine) {
        showAllMins()
        gameOver(false)
    }
    gBoard[i][j].isShown = true
    gGame.shownCount++

    elCell.classList.add('shown')//shown

    renderCell(elCell, i, j)

    if (elCell.innerHTML === EMPTY) expandShown(i, j)

    checkGameOver()
}

// function onCellClicked(elCell, i, j) {//I didn't finush
//     console.log(gGame.shownCount);
//     if (gGame.shownCount === 0) {
//         putMinesOnBoard(gBoard)
//         UpdatBoardMinesNegsCount(gBoard)
//         renderBoard(gBoard)
//     } else {

//         if (gGame.secsPassed === 0) startTimer()
//         if (gBoard[i][j].isMarked) return
//         if (gBoard[i][j].isMine) gameOver()


//         if (elCell.innerHTML === EMPTY) expandShown(i, j)

//         checkGameOver()
//     }
//     gBoard[i][j].isShown = true
//     gGame.shownCount++

//     elCell.classList.add('shown')//shown

//     renderCell(elCell, i, j)
//     console.log(gGame.shownCount);

// }

function onCellMarked(elCell, i, j) {
    document.addEventListener('contextmenu', event => {
        event.preventDefault();
    })

    if (gBoard[i][j].isShown) return

    if (gBoard[i][j].isMarked) {
        gBoard[i][j].isMarked = false
        gGame.markedCount--
        renderCell(elCell, i, j, EMPTY)
    } else {
        gBoard[i][j].isMarked = true
        gGame.markedCount++
        renderCell(elCell, i, j, FLAG)
    }
    // console.log('markedCount:', gGame.markedCount)

}


function expandShown(rowIdx, colIdx) {

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === rowIdx && j === colIdx) continue
            if (gBoard[i][j].isMarked) continue

            if (!gBoard[i][j].isShown) {
                gBoard[i][j].isShown = true
                gGame.shownCount++
            }
            // console.log('gGame.shownCount:', gGame.shownCount)

            const elNegCell = document.querySelector(`.cell-${i}-${j}`)
            elNegCell.classList.add('shown')//shown
            renderCell(elNegCell, i, j)

        }
    }
    // console.log('gBoard', gBoard);

}

function checkGameOver() {
    var numCellsShuldBeShown = gLevel.SIZE ** 2 - gLevel.MINES
    var numCellsShuldBeMarked = gLevel.MINES

    if (gGame.shownCount === numCellsShuldBeShown &&
        gGame.markedCount === numCellsShuldBeMarked) {
        console.log('victory')
        // clearInterval(gGame.secsPassed)
        gameOver(true)
    }

}
function showAllMins() {
    //when clicking a mine, all the mines are revealed
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (!gBoard[i][j].isMine) continue
            gBoard[i][j].isShown = true

            const elCell = document.querySelector(`.cell-${i}-${j}`)
            renderCell(elCell, i, j, MINE)

        }
    }
}

function gameOver(isVictory) {
    gGame.isOn = false
    clearInterval(gGame.secsPassed)

    showGameOver()
    const elMsgSpan = document.querySelector('.game-over .msg')
    elMsgSpan.innerText = isVictory ? 'VICTORY' : 'GAME OVER'
    gGame.isOn = false
}

function startTimer() {
    var startTime = Date.now()
    var elTimer = document.querySelector('.time')

    gGame.secsPassed = setInterval(() => {
        const elapsedTime = Date.now() - startTime
        const formattedTime = (elapsedTime / 1000).toFixed(0)
        elTimer.innerText = formattedTime
    }, 37)
}


function showGameOver() {
    const el = document.querySelector('.game-over')
    el.classList.remove('hide')
}

function hideGameOver() {
    const el = document.querySelector('.game-over')
    el.classList.add('hide')

}
