import React, { Component } from "react";
import Neworder from "./order.js";

import "./list.css";
import axios from "axios";

import Loading from "../../Admin/loading";
class List extends Component {
  state = {
    orders: null,
  };
  componentDidMount() {
    axios
      .get(
        "https://europe-west1-foodorderproject-fe50a.cloudfunctions.net/api/getOrders"
      )
      .then((res) => {
        this.setState({
          orders: res.data,
        });
      })
      .catch((err) => console.log(err));
  }

  render() {
    const date = new Date();
    var visibility = false;

    let ordersMarkup = this.state.orders ? (
      this.state.orders.map((ord) => {
        if (Math.floor(new Date(date.getTime() / 1000)) >= ord.requestedTime) {
          visibility = true;
        }

        return <Neworder key={ord.id} ord={ord} visibility={visibility} />;
      })
    ) : (
      <Loading />
    );

    return (
      <div className="order">
        <button id="btn" className=" btn btn-dark w-100 " type="button">
          Today's group orders
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-justify-left m-1"
            viewBox="0 0 16 16"
          >
            <path d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
          </svg>
        </button>

        <div>{ordersMarkup}</div>
      </div>
    );
  }
}

export default List;
