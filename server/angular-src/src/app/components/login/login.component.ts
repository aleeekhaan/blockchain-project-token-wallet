import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  email : String;
  password : String;

  constructor(private _snackBar : MatSnackBar, private router : Router, private walletService : WalletService) { }

  ngOnInit(): void {
  }

  async onSubmit () {
    let data = {
      "email" : this.email,
      "password" : this.password
    }

    let res = await this.walletService.login(data);
    console.log(res)
    if(res.success) {
      this._snackBar.open("Successfully Logged in.", "", {
        duration: 2000,
      });
      this.router.navigate(['/dashboard'])
    }
    else {
      this._snackBar.open(res.err, "", {
        duration: 2000,
      });
    }    
  }

}
