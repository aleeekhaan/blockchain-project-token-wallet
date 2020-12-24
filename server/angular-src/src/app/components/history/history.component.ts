import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

  displayedColumns: string[] = ['txId', 'bal'];

  historyArr = [{"txId" : "1", "bal" : 1}]

  constructor() { }

  ngOnInit(): void {
  }

}
