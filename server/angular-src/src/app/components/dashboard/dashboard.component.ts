import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {


  user = {
    "name" : "",
    "email" : "",
    "balance" : ""
  }

  deposit = {
    email : "",
    amount : 0
  }

  withdraw = {
    email : "",
    amount : 0
  }

  transfer = {
    to : "",
    from : "",
    amount : 0
  }



  constructor(private walletService : WalletService, private _snackBar : MatSnackBar) { }

  ngOnInit(): void {
    this.initializeUser()
  }

  async initializeUser () {
    let balance = await this.walletService.getAccountBalance();
    let userData = this.walletService.getUserData()

    this.user.balance = balance;
    this.user.email = userData.email;
    this.user.name = userData.name;
  }

  depositAmount () {
    this.deposit.email = this.user.email;
    this.walletService.deposit(this.deposit)
      .subscribe(res => {
        console.log(res)
        if(res.success) {
          this._snackBar.open("Successfully deposited.", "", {
            duration : 2000
          })
          this.user.balance = res.updatedBalance;
        }
        else { 
          this._snackBar.open("Deposit Failed.", "", {
            duration : 2000
          })
        }
      })
  }

  transferAmount () {
    this.transfer.from = this.user.email;
    this.walletService.transfer(this.transfer)
      .subscribe(res => {
        console.log(res)
        if(res.success) {
          this._snackBar.open("Successfully Transfer.", "", {
            duration : 2000
          })
          this.user.balance = res.updatedBalance_sender;
        }
        else { 
          this._snackBar.open("Transfer Failed.", "", {
            duration : 2000
          })
        }
      })
  }

  withdrawAmount () {
    this.withdraw.email = this.user.email;
    this.walletService.withdraw(this.withdraw)
      .subscribe(res => {
        console.log(res)
        if(res.success) {
          this._snackBar.open("Successfully withdrawed.", "", {
            duration : 2000
          })
          this.user.balance = res.updatedBalance;
        }
        else { 
          this._snackBar.open("Withdraw Failed.", "", {
            duration : 2000
          })
        }
      })
  }

}
