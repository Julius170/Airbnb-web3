import React, { useState, useEffect } from "react";
import "./Rentals.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router";
import { Button, ConnectButton, Icon, useNotification } from "web3uikit";
import logo from "../images/airbnbRed.png";
import RentalsMap from "../components/RentalsMap";
import { useMoralis, useWeb3ExecuteFunction } from 'react-moralis';
import User from '../components/User'




const Rentals = () => {
  const { state : searchFilters } = useLocation();
  const [highlight, setHighLight] = useState();
  const { Moralis, account } = useMoralis();
  const [rentalsList, setRentalsList] = useState();
  const [coOrdinates, setcoOrdinates] = useState();
  const contractProcessor = useWeb3ExecuteFunction();
  const dispatch = useNotification();

  const handleSuccess = () => {
    dispatch({
      type: "success",
      message: `Nice! You are going to ${searchFilters.destination}!!`,
      title: "Booking Successful",
      position: "topL"
    });
  };
  
  const handleError = (msg) => {
    dispatch({
      type: "error",
      message: `${msg}`,
      title: "Booking Failed",
      poition: "topL",
    });
  };

  const handleNoAccount = () => {
    dispatch({
      type: "error",
      message: `You need to connect you wallet to book a rental`,
      title: `Not Connected`,
      position: "topL",
    });
  };

  useEffect(() => {
    async function fetchRentalsList() {
      const Rentals = Moralis.Object.extend("Rentals");
      const query = new Moralis.Query(Rentals);
      query.equalTo("city", searchFilters.destination);
      query.greaterThanOrEqualTo("maxGuest_decimal", searchFilters.guests);

      const result = await query.find();
      let cords = []
      result.forEach((e) => {
        cords.push({lat: e.attributes.lat, lng: e.attributes.long });
      });
      setcoOrdinates(cords);

      setRentalsList(result);

    }      
    fetchRentalsList()

  }, [Moralis.Object, Moralis.Query, searchFilters]);

  const bookRental = async function(start, end, id, dayPrice) {
    for (
      var arr = [], dt = new Date(start);
      dt <= end;
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt).toISOString().slice(0,10));
    }

    let options = {
      contractAddress: "",
      functionName: "addDatesBooked",
      abi: [],
      params: {
        id:id,
        newBookings: arr
      },
      msgValue: Moralis.Units.ETH(dayPrice * arr.length)
    }


    await contractProcessor.fetch({
      params:options,
      onSuccess: () => {
        handleSuccess();
      },
      onError: (error)=> {
        handleError(error.data.message)
      }
    }); 
  };

  return (
    <>
      <div className="topBanner">
        <div>
          <Link to={"/"}>
            <img className="logo" src={logo} alt="logo"></img>
          </Link>
        </div>
          <div className="searchReminder">
            <div className="filter">
              {searchFilters.destination}              
            </div>
            <div className="vl" />
            <div className="filter">
              {`
              ${searchFilters.checkIn.toLocaleString("default", {month:"short",})}
              ${searchFilters.checkIn.toLocaleString("default", {day:"2-digit",})}
              -
              ${searchFilters.checkOut.toLocaleString("default", {month:"short",})}
              ${searchFilters.checkOut.toLocaleString("default", {day:"2-digit",})}
              `}
            </div>
            <div className="vl" />
            <div className="filter">
              {searchFilters.guests} Guest
            </div>
            <div className="searchFiltersIcon">
              <Icon fill="#ffffff" size={20} svg="search" />
            </div>
          </div>

        </div>
          <div className="lrContainer">
            {account && 
            <User account= {account}/>
            }
            <ConnectButton />
          </div>


          <hr className="line" />
          <div className="rentalsContent">
            <div className="rentalsContentL">
              Stays Available for your destination
              {rentalsList &&
              rentalsList.map((e, i) => {
                 return (
                  <>
                  <hr className="line2" />
                  <div className={highlight === i ? "rentalDivH": "rentslDiv"}>
                    <img className="rentalImg" src={e.attributes.imgUrl} alt=""></img>
                    <div className="rentalInfo">
                      <div className="rentalTitle">{e.attributes.name}</div>
                      <div className="rentalDesc">
                        {e.attributes.unoDescription}
                      </div>
                      <div className="rentalDesc">
                        {e.attributes.dosDescription}
                      </div>
                      <div className="bottomButton">
                        <Button 
                        onClick={() => {
                          if (account){
                            bookRental(
                              searchFilters.checkIn,
                              searchFilters.checkOut,
                              e.attributer.uid_decimal.value.$numberDecimal)
                        }else{
                          handleNoAccount()
                        }
                        }}
                        text="Stay Here"
                        />
                        <div className= "price">
                          <Icon fill={"#808080"} size={10} svg={"matic"}  /> {e.attributes.pricePerDay} /Day
                        </div>
                      </div>
                    </div>
                  </div>
                  </>
                ) 
               })}
            </div>
            <div className="rentalsContentR">
                
            </div>
            <div className="rentalsContentR">
              {/* <RentalsMap locations={coOrdinates} setHighLight={setHighLight}/> */}
            </div>  
    </div>
  </>
  );
};

export default Rentals;
