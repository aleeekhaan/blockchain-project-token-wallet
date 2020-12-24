import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  fname : String;
  lname : String;
  email : String;
  password : String;

  constructor(private _snackBar : MatSnackBar, private router : Router, private walletService : WalletService) { }

  ngOnInit(): void {
  }

  onSubmit () {
    let data = {
      "fname" : this.fname,
      "lname" : this.lname,
      "email" : this.email,
      "password" : this.password
    } 

    this.walletService.register(data)
      .subscribe(res => {
        console.log(res)
        if(res.success) {
          this._snackBar.open("Successfully Registered.", "", {
            duration: 2000,
          });
          this.router.navigate(['/login']);
        }
        else {
          this._snackBar.open(res.err, "", {
            duration: 2000,
          });
        }
      })
  }

}
